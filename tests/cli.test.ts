import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGenerator } from '../src/create-generator';
import { parseArgs, requestsFromArgs, main } from '../src/cli';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('CLI adapter', () => {
  it('parses flags', () => {
    expect(parseArgs(['--all', '--list', '--template=welcome', '--data=./p.json', '--out=out'])).toEqual({
      all: true,
      list: true,
      template: 'welcome',
      data: './p.json',
      out: 'out',
    });
  });

  it('maps argv to GenerateRequest and runs the engine', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-cli-'));
    tempDirs.push(dir);
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: () => '<p>w</p>' }],
      samplePayloads: { welcome: {} },
      outDir: dir,
    });
    const requests = requestsFromArgs(parseArgs(['--template=welcome', `--out=${path.join(dir, 'welcome.html')}`]), gen);
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
});
