#!/usr/bin/env node
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG, SAMPLE_PAYLOADS, type TemplateCatalogEntry } from './template-catalog';

const requireData = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATES_DIR = path.join(ROOT, 'src', 'templates');
export const DATA_DIR = path.join(ROOT, 'src', 'data');
export const DEFAULT_OUT_DIR = 'generated';
const SKIP_FILES = new Set(['index.js', 'index2.js', 'registry.ts', 'registry.js']);

export interface CliArgs {
  all?: boolean;
  list?: boolean;
  template?: string;
  data?: string;
  out?: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  argv.forEach((arg) => {
    if (arg === '--all') {
      args.all = true;
      return;
    }
    if (arg === '--list') {
      args.list = true;
      return;
    }
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      const key = match[1] as keyof CliArgs;
      (args as Record<string, string | boolean>)[key] = match[2] as string;
    }
  });
  return args;
}

export function listTemplateFiles(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter((name) => {
      if (SKIP_FILES.has(name)) return false;
      if (/LATER\./i.test(name)) return false;
      return /\.(ts|js)$/.test(name);
    })
    .sort();
}

export function findEntry(templateId: string): TemplateCatalogEntry | undefined {
  const needle = String(templateId).toLowerCase();
  return CATALOG.find((entry) => entry.ids.some((id) => id.toLowerCase() === needle));
}

export function slugFromId(templateId: string): string {
  const entry = findEntry(templateId);
  return (entry ? entry.ids[0] : String(templateId))
    .replace(/Email$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

export function loadPayload(templateId: string, dataPath?: string): unknown {
  if (dataPath) return requireData(path.resolve(process.cwd(), dataPath));
  if (SAMPLE_PAYLOADS[templateId]) return SAMPLE_PAYLOADS[templateId];
  const slugs = [templateId, slugFromId(templateId)];
  for (const slug of slugs) {
    const candidate = path.join(DATA_DIR, `${slug}.data.js`);
    if (fs.existsSync(candidate)) return requireData(candidate);
  }
  throw new Error(
    `No payload for "${templateId}". Pass --data=path or add src/data/${slugFromId(templateId)}.data.js`
  );
}

export function writeHtml(outPath: string, html: string): string {
  const resolvedOutPath = path.resolve(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(resolvedOutPath), { recursive: true });
  fs.writeFileSync(resolvedOutPath, html, 'utf8');
  return resolvedOutPath;
}

export function serializePayload(payload: unknown): string {
  return JSON.stringify(replaceDates(payload));
}

function replaceDates(value: unknown): unknown {
  if (value instanceof Date) return { __date: value.toISOString() };
  if (Array.isArray(value)) return value.map(replaceDates);
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, current] of Object.entries(value as Record<string, unknown>)) {
      next[key] = replaceDates(current);
    }
    return next;
  }
  return value;
}

export function reviveDates(value: unknown): unknown {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && '__date' in value && typeof (value as { __date?: unknown }).__date === 'string') {
    return new Date((value as { __date: string }).__date);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>).forEach((key) => {
      const current = (value as Record<string, unknown>)[key];
      if (key === 'signupDate') {
        const revived = reviveDates(current);
        next[key] = revived instanceof Date ? revived : new Date(current as string | Date);
        return;
      }
      next[key] = reviveDates(current);
    });
    return next;
  }
  return value;
}

export function renderOne(templateId: string, payload: unknown): string {
  const entry = findEntry(templateId);
  if (!entry) {
    throw new Error(`Unknown template id: "${templateId}". Available: ${CATALOG.flatMap((item) => item.ids).join(', ')}`);
  }
  const modulePath = path.join(TEMPLATES_DIR, entry.file);
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Template file missing: ${path.relative(ROOT, modulePath)}`);
  }
  const payloadPath = path.join(os.tmpdir(), `generate-template-payload-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(payloadPath, serializePayload(reviveDates(payload)), 'utf8');
  const source = `
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
function revive(value) {
  if (value && typeof value === 'object' && typeof value.__date === 'string') return new Date(value.__date);
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, val] of Object.entries(value)) {
      next[key] = key === 'signupDate' ? new Date(typeof val === 'object' && val.__date ? val.__date : val) : revive(val);
    }
    return next;
  }
  return value;
}
const raw = JSON.parse(readFileSync(${JSON.stringify(payloadPath)}, 'utf8'));
const mod = await import(pathToFileURL(${JSON.stringify(modulePath)}).href);
const exported = mod[${JSON.stringify(entry.exportName)}] ?? mod.default;
if (!exported) throw new Error('Export missing');
const html = typeof exported === 'function' ? exported(revive(raw)) : exported.render(revive(raw));
process.stdout.write(html);
`;
  try {
    return runStripTypes(source);
  } finally {
    fs.rmSync(payloadPath, { force: true });
  }
}

function runStripTypes(source: string): string {
  const tmpFile = path.join(os.tmpdir(), `generate-template-${process.pid}-${Date.now()}.mts`);
  fs.writeFileSync(tmpFile, source, 'utf8');
  try {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--no-warnings', tmpFile],
      { encoding: 'utf8', cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }
    );
    if (result.status !== 0) {
      const err = (result.stderr || result.stdout || '').trim();
      throw new Error(err || `node exited ${result.status}`);
    }
    return result.stdout;
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

export function main(argv = process.argv.slice(2)): void {
  const args = parseArgs(argv);
  const templateFiles = listTemplateFiles();
  if (args.list) {
    console.log('Files in src/templates:');
    templateFiles.forEach((file) => console.log(`  ${file}`));
    console.log('Generatable templates:');
    CATALOG.forEach((entry) => {
      const exists = fs.existsSync(path.join(TEMPLATES_DIR, entry.file));
      console.log(`  ${entry.ids.join(' | ')}  <- ${entry.file}${exists ? '' : ' (missing)'}`);
    });
    return;
  }
  const wantAll = args.all === true || !args.template || args.template === 'all';
  const targets = wantAll ? CATALOG.map((entry) => entry.ids[0]) : [args.template as string];
  targets.forEach((templateId) => {
    const payload = loadPayload(templateId, wantAll ? undefined : args.data);
    const html = renderOne(templateId, payload);
    const fileName = `${slugFromId(templateId)}.html`;
    const outPath = wantAll
      ? path.join(args.out || DEFAULT_OUT_DIR, fileName)
      : args.out || path.join(DEFAULT_OUT_DIR, fileName);
    console.log(writeHtml(outPath, html));
  });
  if (wantAll) {
    const catalogFiles = new Set(CATALOG.map((entry) => entry.file));
    const extra = templateFiles.filter((file) => !catalogFiles.has(file));
    if (extra.length) console.warn(`Warning: src/templates files not in generate catalog: ${extra.join(', ')}`);
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsCli =
  typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === thisFile;

if (invokedAsCli) {
  main();
}
