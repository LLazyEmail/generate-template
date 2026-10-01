import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGenerator } from '../../src/create-generator';
import { GenerateTemplateError } from '../../src/engine/errors';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function fixtureDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-file-adapter-'));
  tempDirs.push(dir);
  fs.writeFileSync(
    path.join(dir, 'hello.js'),
    'export function hello(payload) { return `<p>${payload.n}</p>`; }\n'
  );
  return dir;
}

describe('file adapter (opt-in)', () => {
  it('refuses file entries unless allowFileTemplates is set', async () => {
    const dir = fixtureDir();
    const gen = createGenerator({
      root: dir,
      templatesDir: dir,
      catalog: [{ ids: ['hello'], file: 'hello.js', exportName: 'hello' }],
    });

    try {
      await gen.render('hello', { payload: { n: 'x' } });
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(GenerateTemplateError);
      expect((error as GenerateTemplateError).code).toBe('RENDER_FAILED');
      expect((error as GenerateTemplateError).message).toMatch(/allowFileTemplates/);
    }
  });

  it('loads a JS module when allowFileTemplates is true', async () => {
    const dir = fixtureDir();
    const gen = createGenerator({
      root: dir,
      templatesDir: dir,
      allowFileTemplates: true,
      catalog: [{ ids: ['hello'], file: 'hello.js', exportName: 'hello' }],
    });

    expect(await gen.render('hello', { payload: { n: 'ok' } })).toBe('<p>ok</p>');
  });

  it('fails when the template file is missing even with the flag', async () => {
    const dir = fixtureDir();
    const gen = createGenerator({
      root: dir,
      templatesDir: dir,
      allowFileTemplates: true,
      catalog: [{ ids: ['hello'], file: 'missing.js', exportName: 'hello' }],
    });

    await expect(gen.render('hello', { payload: {} })).rejects.toThrow(/Template file missing/);
  });
});
