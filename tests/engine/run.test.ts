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

function engine() {
  return createGenerator({
    catalog: [
      {
        ids: ['welcome', 'WelcomeEmail'],
        render: (p) => `<h1>${(p as { name: string }).name}</h1>`,
      },
    ],
    samplePayloads: { welcome: { name: 'Alex' } },
  });
}

describe('engine.run contract (what other repos should call)', () => {
  it('renders without touching disk', async () => {
    const result = await engine().run({ templateId: 'welcome' });
    expect(result).toEqual({ templateId: 'welcome', html: '<h1>Alex</h1>' });
  });

  it('accepts an explicit payload over the sample', async () => {
    const result = await engine().run({ templateId: 'WelcomeEmail', payload: { name: 'Sam' } });
    expect(result.html).toBe('<h1>Sam</h1>');
  });

  it('writes only when write is set', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-run-write-'));
    tempDirs.push(dir);
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: () => '<p>w</p>' }],
      samplePayloads: { welcome: {} },
      outDir: dir,
    });
    const result = await gen.run({
      templateId: 'welcome',
      write: { out: path.join(dir, 'welcome.html') },
    });
    expect(result.path).toBe(path.resolve(dir, 'welcome.html'));
    expect(fs.readFileSync(result.path as string, 'utf8')).toBe('<p>w</p>');
  });

  it('writeAll renders every catalog entry', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-run-all-'));
    tempDirs.push(dir);
    const gen = createGenerator({
      catalog: [
        { ids: ['a'], render: () => '<a/>' },
        { ids: ['b'], render: () => '<b/>' },
      ],
      samplePayloads: { a: {}, b: {} },
    });
    const paths = await gen.writeAll(dir);
    expect(paths).toHaveLength(2);
    expect(fs.readFileSync(path.join(dir, 'a.html'), 'utf8')).toBe('<a/>');
    expect(fs.readFileSync(path.join(dir, 'b.html'), 'utf8')).toBe('<b/>');
  });

  it('surfaces UNKNOWN_TEMPLATE with a code other repos can switch on', async () => {
    await expect(engine().run({ templateId: 'missing', payload: {} })).rejects.toMatchObject({
      name: 'GenerateTemplateError',
      code: 'UNKNOWN_TEMPLATE',
      templateId: 'missing',
    } satisfies Partial<GenerateTemplateError>);
  });
});
