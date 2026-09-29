import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GenerateTemplateError } from './errors';
import type { TemplateCatalogEntry, TemplateRenderer } from './types';
import { availableIds, findEntry } from './resolve';
import { reviveDates, serializePayload } from './payload';

export function invokeRenderer(renderer: TemplateRenderer, payload: unknown, templateId?: string): string {
  const html = typeof renderer === 'function' ? renderer(payload) : renderer.render(payload);
  if (typeof html !== 'string') {
    throw new GenerateTemplateError('RENDER_FAILED', 'Template renderer must return a string', templateId);
  }
  return html;
}

export function renderEntry(options: {
  templateId: string;
  payload: unknown;
  catalog: TemplateCatalogEntry[];
  templatesDir: string;
  root: string;
}): string {
  const { templateId, payload, catalog, templatesDir, root } = options;
  const entry = findEntry(catalog, templateId);
  if (!entry) {
    throw new GenerateTemplateError(
      'UNKNOWN_TEMPLATE',
      `Unknown template id: "${templateId}". Available: ${availableIds(catalog).join(', ')}`,
      templateId
    );
  }

  const revived = reviveDates(payload);

  if (entry.render) {
    return invokeRenderer(entry.render, revived, templateId);
  }

  if (!entry.file) {
    throw new GenerateTemplateError(
      'RENDER_FAILED',
      `Template "${templateId}" has no render function or file`,
      templateId
    );
  }

  const modulePath = path.join(templatesDir, entry.file);
  if (!fs.existsSync(modulePath)) {
    throw new GenerateTemplateError(
      'RENDER_FAILED',
      `Template file missing: ${path.relative(root, modulePath)}`,
      templateId
    );
  }

  try {
    return renderFromFile(modulePath, entry.exportName ?? 'default', revived, root);
  } catch (error) {
    if (error instanceof GenerateTemplateError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new GenerateTemplateError('RENDER_FAILED', message, templateId);
  }
}

function renderFromFile(modulePath: string, exportName: string, payload: unknown, root: string): string {
  const payloadPath = path.join(os.tmpdir(), `generate-template-payload-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(payloadPath, serializePayload(payload), 'utf8');
  const source = `
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
function revive(value) {
  if (value && typeof value === 'object' && typeof value.__date === 'string') return new Date(value.__date);
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, val] of Object.entries(value)) {
      next[key] = revive(val);
    }
    return next;
  }
  return value;
}
const raw = JSON.parse(readFileSync(${JSON.stringify(payloadPath)}, 'utf8'));
const mod = await import(pathToFileURL(${JSON.stringify(modulePath)}).href);
const exported = mod[${JSON.stringify(exportName)}] ?? mod.default;
if (!exported) throw new Error('Export missing');
const html = typeof exported === 'function' ? exported(revive(raw)) : exported.render(revive(raw));
process.stdout.write(html);
`;
  try {
    return runStripTypes(source, root);
  } finally {
    fs.rmSync(payloadPath, { force: true });
  }
}

function runStripTypes(source: string, root: string): string {
  const tmpFile = path.join(os.tmpdir(), `generate-template-${process.pid}-${Date.now()}.mts`);
  fs.writeFileSync(tmpFile, source, 'utf8');
  try {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--no-warnings', tmpFile],
      { encoding: 'utf8', cwd: root, maxBuffer: 10 * 1024 * 1024 }
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
