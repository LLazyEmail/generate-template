import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGenerator as packageFactory } from '../src/create-generator';
import { createGenerator } from '../src/index';
import { findConfigPath, loadProjectGenerator } from '../src/config';
import { parseArgs, requestsFromArgs, main } from '../src/cli';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-cli-'));
  tempDirs.push(dir);
  return dir;
}

describe('CLI adapter', () => {
  it('parses flags', () => {
    expect(
      parseArgs([
        '--all',
        '--list',
        '--help',
        '--template=welcome',
        '--data=./p.json',
        '--out=out',
        '--config=gen.js',
      ]),
    ).toEqual({
      all: true,
      list: true,
      help: true,
      template: 'welcome',
      data: './p.json',
      out: 'out',
      config: 'gen.js',
    });
  });

  it('uses the same createGenerator as the package entry', () => {
    expect(packageFactory).toBe(createGenerator);
  });

  it('maps argv to GenerateRequest and runs the engine', async () => {
    const dir = tempDir();
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: () => '<p>w</p>' }],
      samplePayloads: { welcome: {} },
      outDir: dir,
    });
    const requests = requestsFromArgs(
      parseArgs(['--template=welcome', `--out=${path.join(dir, 'welcome.html')}`]),
      gen,
    );
    expect(requests).toEqual([
      {
        templateId: 'welcome',
        dataPath: undefined,
        write: { out: path.join(dir, 'welcome.html') },
      },
    ]);
    const result = await gen.run(requests[0]);
    expect(result.path).toBe(path.resolve(dir, 'welcome.html'));
    expect(fs.readFileSync(result.path as string, 'utf8')).toBe('<p>w</p>');
  });

  it('main --list does not write', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: () => 'x' }],
    });
    await main(['--list'], gen);
  });

  it('--all writes through writeAll once per catalog entry', async () => {
    const dir = tempDir();
    const render = vi.fn(() => '<html>ok</html>');
    const gen = createGenerator({
      catalog: [
        { ids: ['welcome'], render },
        { ids: ['invoice'], render },
      ],
      samplePayloads: { welcome: {}, invoice: {} },
      outDir: dir,
    });
    await main(['--all', `--out=${dir}`], gen);
    expect(render).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync(path.join(dir, 'welcome.html'), 'utf8')).toBe('<html>ok</html>');
    expect(fs.readFileSync(path.join(dir, 'invoice.html'), 'utf8')).toBe('<html>ok</html>');
  });

  it('assert command checks slugs from the generator', async () => {
    const dir = tempDir();
    const previous = process.exitCode;
    fs.writeFileSync(path.join(dir, 'welcome.html'), '<html></html>');
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: () => '<html></html>' }],
      outDir: dir,
    });
    const errors: string[] = [];
    const logged: string[] = [];
    const log = console.log;
    const error = console.error;
    console.log = (message?: unknown) => logged.push(String(message));
    console.error = (message?: unknown) => errors.push(String(message));
    try {
      await main(['assert', `--out=${dir}`], gen);
      expect(logged.at(-1)).toContain('ok: 1 generated HTML files');
      await main(['assert', '--slugs=missing', `--out=${dir}`], gen);
      expect(errors.at(-1)).toContain('Missing generated files:');
      expect(process.exitCode).toBe(1);
    } finally {
      console.log = log;
      console.error = error;
      process.exitCode = previous;
    }
  });

  it('--help prints usage and does not write', async () => {
    const logs: string[] = [];
    const log = console.log;
    console.log = (message?: unknown) => logs.push(String(message));
    try {
      await main(['--help']);
      expect(logs.join('\n')).toContain('generate-template — render a project catalog');
    } finally {
      console.log = log;
    }
  });

  it('rejects a config that does not export a generator', async () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'bad.mjs'), 'export const generator = { catalog: [] };');
    await expect(loadProjectGenerator({ cwd: dir, config: 'bad.mjs' })).rejects.toThrow(
      /Invalid config/,
    );
  });

  it('loads createProjectGenerator from a config module', async () => {
    const dir = tempDir();
    fs.writeFileSync(
      path.join(dir, 'generate-template.config.mjs'),
      `export function createProjectGenerator() {
        return { catalog: [{ ids: ['welcome'] }], run() {}, writeAll() { return []; } };
      }`,
    );
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ generateTemplate: './other.mjs' }),
    );
    expect(findConfigPath(dir)).toBe(path.join(dir, 'other.mjs'));
    fs.rmSync(path.join(dir, 'package.json'));
    const gen = await loadProjectGenerator({ cwd: dir });
    expect(gen?.catalog[0].ids).toEqual(['welcome']);
  });

  it('--data uses the package payload loader', async () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'payload.js'), 'export default { name: "Ada" };');
    const gen = createGenerator({
      catalog: [
        {
          ids: ['welcome'],
          render: (payload) => `<html>${(payload as { name: string }).name}</html>`,
        },
      ],
      root: dir,
      dataDir: dir,
    });
    await main(
      [
        '--template=welcome',
        `--data=${path.join(dir, 'payload.js')}`,
        `--out=${path.join(dir, 'welcome.html')}`,
      ],
      gen,
    );
    expect(fs.readFileSync(path.join(dir, 'welcome.html'), 'utf8')).toBe('<html>Ada</html>');
  });
});
