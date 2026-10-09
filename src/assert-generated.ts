import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { TemplateGenerator } from './engine';

/** A generated file must look like an HTML document, matching the postmark assert script. */
const HTML_MARKERS = ['<html', '<!doctype'] as const;

export interface AssertGeneratedOptions {
  /** Output basenames, without `.html`. */
  slugs: readonly string[];
  /** Directory of generated files. Relative paths resolve from `cwd`. Default `generated`. */
  outDir?: string;
  /** Base for a relative `outDir`. Default `process.cwd()`. */
  cwd?: string;
}

export interface AssertGeneratedResult {
  ok: boolean;
  outDir: string;
  checked: number;
  missing: string[];
  /** Present, but empty or not an HTML document. */
  invalid: string[];
}

export function slugsFromGenerator(
  generator: Pick<TemplateGenerator, 'catalog' | 'slug'>,
): string[] {
  return generator.catalog.map((entry) => generator.slug(entry.ids[0]));
}

export function readSlugsFile(filePath: string): string[] {
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (
    !Array.isArray(parsed) ||
    parsed.some((slug) => typeof slug !== 'string' || slug.length === 0)
  ) {
    throw new Error(`Slug file must be a JSON array of non-empty strings: ${filePath}`);
  }
  return parsed;
}

export function outDirFromArgv(argv: readonly string[], fallback = 'generated'): string {
  const hit = argv.find((arg) => arg.startsWith('--out='));
  return hit ? hit.slice('--out='.length) : fallback;
}

export function slugsFromArgv(argv: readonly string[]): string[] | undefined {
  const hit = argv.find((arg) => arg.startsWith('--slugs='));
  if (!hit) return undefined;
  return hit
    .slice('--slugs='.length)
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);
}

export function slugsFileFromArgv(argv: readonly string[]): string | undefined {
  const hit = argv.find((arg) => arg.startsWith('--slugs-file='));
  return hit ? hit.slice('--slugs-file='.length) : undefined;
}

/**
 * Check that each slug has a generated HTML file.
 * Port of postmark-transactional-template-simple/scripts/assert-generated.ts.
 * Does not exit; callers decide how to report `missing` and `invalid`.
 */
export function assertGenerated(options: AssertGeneratedOptions): AssertGeneratedResult {
  const cwd = options.cwd ?? process.cwd();
  const outDir = path.resolve(cwd, options.outDir ?? 'generated');
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const slug of options.slugs) {
    const filePath = path.join(outDir, `${slug}.html`);
    if (!existsSync(filePath)) {
      missing.push(filePath);
      continue;
    }
    const html = readFileSync(filePath, 'utf8').toLowerCase();
    if (!HTML_MARKERS.some((marker) => html.includes(marker))) {
      invalid.push(filePath);
    }
  }

  return {
    ok: missing.length === 0 && invalid.length === 0,
    outDir,
    checked: options.slugs.length,
    missing,
    invalid,
  };
}

export function formatAssertGenerated(result: AssertGeneratedResult): string {
  if (result.ok) {
    return `ok: ${result.checked} generated HTML files in ${result.outDir}`;
  }
  const lines: string[] = [];
  if (result.missing.length) lines.push(`Missing generated files:\n${result.missing.join('\n')}`);
  if (result.invalid.length)
    lines.push(`Empty or non-HTML generated files:\n${result.invalid.join('\n')}`);
  return lines.join('\n');
}

export interface RunAssertGeneratedOptions {
  argv?: readonly string[];
  slugs?: readonly string[];
  outDir?: string;
  cwd?: string;
  log?: (message: string) => void;
  error?: (message: string) => void;
}

/**
 * CLI adapter for assert-generated.
 * Flags: `--out=` `--slugs=a,b` `--slugs-file=path.json`
 * Prints the same report as the postmark script and sets `process.exitCode`.
 */
export function runAssertGenerated(options: RunAssertGeneratedOptions = {}): AssertGeneratedResult {
  const argv = options.argv ?? process.argv.slice(2);
  const cwd = options.cwd ?? process.cwd();
  const log = options.log ?? console.log;
  const error = options.error ?? console.error;
  const slugsFile = slugsFileFromArgv(argv);
  const slugs =
    options.slugs ??
    slugsFromArgv(argv) ??
    (slugsFile ? readSlugsFile(path.resolve(cwd, slugsFile)) : undefined);

  if (!slugs) {
    const result: AssertGeneratedResult = {
      ok: false,
      outDir: path.resolve(cwd, options.outDir ?? outDirFromArgv(argv)),
      checked: 0,
      missing: [],
      invalid: [],
    };
    error(
      'Error: pass slugs via --slugs=a,b, --slugs-file=path.json, or runAssertGenerated({ slugs }).',
    );
    process.exitCode = 1;
    return result;
  }

  const result = assertGenerated({
    slugs,
    outDir: options.outDir ?? outDirFromArgv(argv),
    cwd,
  });
  if (result.ok) log(formatAssertGenerated(result));
  else {
    error(formatAssertGenerated(result));
    process.exitCode = 1;
  }
  return result;
}
