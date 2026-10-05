import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertGenerated,
  formatAssertGenerated,
  readSlugsFile,
  runAssertGenerated,
  slugsFromGenerator,
} from '../src/assert-generated';
import { createGenerator } from '../src/create-generator';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-assert-'));
  tempDirs.push(dir);
  return dir;
}

describe('assertGenerated', () => {
  it('accepts html and doctype documents and reports missing or empty files', () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'welcome.html'), '<!DOCTYPE html><html></html>');
    fs.writeFileSync(path.join(dir, 'invoice.html'), '<p>not a document</p>');

    const result = assertGenerated({ slugs: ['welcome', 'invoice', 'missing'], outDir: dir });

    expect(result.ok).toBe(false);
    expect(result.checked).toBe(3);
    expect(result.missing).toEqual([path.join(dir, 'missing.html')]);
    expect(result.invalid).toEqual([path.join(dir, 'invoice.html')]);
    expect(formatAssertGenerated(result)).toContain('Missing generated files:');
    expect(formatAssertGenerated(result)).toContain('Empty or non-HTML generated files:');
  });

  it('reports ok with the resolved out dir', () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'welcome.html'), '<html><body>hi</body></html>');

    const result = assertGenerated({ slugs: ['welcome'], outDir: dir });

    expect(result.ok).toBe(true);
    expect(formatAssertGenerated(result)).toBe(`ok: 1 generated HTML files in ${dir}`);
  });

  it('reads a slug json file and derives slugs from a catalog', () => {
    const dir = tempDir();
    const slugsFile = path.join(dir, 'slugs.json');
    fs.writeFileSync(slugsFile, JSON.stringify(['password-reset', 'welcome']));
    expect(readSlugsFile(slugsFile)).toEqual(['password-reset', 'welcome']);

    const generator = createGenerator({
      catalog: [{ ids: ['WelcomeEmail', 'welcome'], render: () => '<html></html>' }],
    });
    expect(slugsFromGenerator(generator)).toEqual(['welcome']);
  });

  it('runAssertGenerated honors --out and --slugs-file and sets exitCode', () => {
    const dir = tempDir();
    const previous = process.exitCode;
    fs.writeFileSync(path.join(dir, 'slugs.json'), '["welcome"]');
    fs.writeFileSync(path.join(dir, 'welcome.html'), '<html></html>');
    const logs: string[] = [];
    const errors: string[] = [];

    const missing = runAssertGenerated({
      argv: ['--out=generated', '--slugs-file=slugs.json'],
      cwd: dir,
      log: (message) => logs.push(message),
      error: (message) => errors.push(message),
    });

    expect(missing.ok).toBe(false);
    expect(missing.missing).toEqual([path.join(dir, 'generated', 'welcome.html')]);
    expect(errors[0]).toContain('Missing generated files:');
    expect(process.exitCode).toBe(1);

    fs.mkdirSync(path.join(dir, 'generated'));
    fs.writeFileSync(path.join(dir, 'generated', 'welcome.html'), '<!doctype html>');
    process.exitCode = undefined;
    const ok = runAssertGenerated({
      argv: ['--out=generated', '--slugs=welcome'],
      cwd: dir,
      log: (message) => logs.push(message),
      error: (message) => errors.push(message),
    });
    expect(ok.ok).toBe(true);
    expect(logs.at(-1)).toContain('ok: 1 generated HTML files');
    process.exitCode = previous;
  });
});
