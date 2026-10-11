import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadProjectGenerator } from '../../src/config';
import { GenerateTemplateError, isGenerateTemplateError } from '../../src/engine/errors';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-config-'));
  tempDirs.push(dir);
  return dir;
}

async function loadError(options: {
  cwd: string;
  config?: string;
}): Promise<GenerateTemplateError> {
  try {
    await loadProjectGenerator(options);
  } catch (error) {
    expect(isGenerateTemplateError(error)).toBe(true);
    return error as GenerateTemplateError;
  }
  throw new Error('expected loadProjectGenerator to throw');
}

describe('config loading errors', () => {
  it('tags a missing explicit config with CONFIG_NOT_FOUND', async () => {
    const dir = tempDir();
    const error = await loadError({ cwd: dir, config: 'missing.js' });
    expect(error.code).toBe('CONFIG_NOT_FOUND');
    expect(error.message).toBe(`Config not found: ${path.join(dir, 'missing.js')}`);
  });

  it('tags a module without a generator with CONFIG_INVALID', async () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'bad.mjs'), 'export const generator = { catalog: [] };');
    const error = await loadError({ cwd: dir, config: 'bad.mjs' });
    expect(error.code).toBe('CONFIG_INVALID');
    expect(error.message).toContain('Invalid config');
    expect(error.message).toContain('createProjectGenerator');
  });

  it('tags an unimportable config with CONFIG_IMPORT_FAILED', async () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'broken.mjs'), 'export const = ;');
    const error = await loadError({ cwd: dir, config: 'broken.mjs' });
    expect(error.code).toBe('CONFIG_IMPORT_FAILED');
    expect(error.message.length).toBeGreaterThan(0);
  });
});
