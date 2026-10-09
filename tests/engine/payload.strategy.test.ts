import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGenerator } from '../../src/create-generator';
import { GenerateTemplateError } from '../../src/engine/errors';
import { loadPayload, reviveDates, serializePayload } from '../../src/engine/payload';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('payload strategy', () => {
  it('uses samplePayloads when no explicit payload is passed', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: (p) => String((p as { name: string }).name) }],
      samplePayloads: { welcome: { name: 'Alex' } },
    });
    expect(await gen.loadPayload('welcome')).toEqual({ name: 'Alex' });
    expect(await gen.render('welcome')).toBe('Alex');
  });

  it('loads JSON via markup-generator when dataPath is set', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-json-'));
    tempDirs.push(dir);
    const dataPath = path.join(dir, 'custom.json');
    fs.writeFileSync(dataPath, JSON.stringify({ name: 'Pat' }));
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: (p) => String((p as { name: string }).name) }],
    });
    expect(await gen.loadPayload('welcome', dataPath)).toEqual({ name: 'Pat' });
    expect(await gen.render('welcome', { dataPath })).toBe('Pat');
  });

  it('prefers a custom loadPayload hook', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: (p) => String((p as { source: string }).source) }],
      samplePayloads: { welcome: { source: 'sample' } },
      loadPayload: async () => ({ source: 'hook' }),
    });
    expect(await gen.render('welcome')).toBe('hook');
  });

  it('does not revive ISO strings unless asked', async () => {
    const iso = '2026-02-01T00:00:00.000Z';
    const gen = createGenerator({
      catalog: [
        {
          ids: ['welcome'],
          render: (p) => typeof (p as { at: unknown }).at,
        },
      ],
    });
    expect(await gen.render('welcome', { payload: { at: iso } })).toBe('string');
    expect(await gen.render('welcome', { payload: { at: iso }, reviveDates: true })).toBe('object');
  });

  it('serializes and revives nested dates', () => {
    const at = new Date('2026-02-01T00:00:00.000Z');
    const serialized = serializePayload({ at, items: [{ at }] });
    expect(serialized).toContain('"__date"');
    const revived = reviveDates(JSON.parse(serialized)) as { at: Date; items: Array<{ at: Date }> };
    expect(revived.at).toBeInstanceOf(Date);
    expect(revived.items[0].at.toISOString()).toBe(at.toISOString());
    expect(reviveDates(at)).toBe(at);
  });

  it('requires a file adapter for dataPath and useDataFiles', async () => {
    await expect(
      loadPayload({
        templateId: 'test',
        dataPath: 'missing.json',
        catalog: [{ ids: ['test'] }],
        samplePayloads: {},
        dataDir: '',
      }),
    ).rejects.toBeInstanceOf(GenerateTemplateError);
    await expect(
      loadPayload({
        templateId: 'test',
        catalog: [{ ids: ['test'] }],
        samplePayloads: {},
        dataDir: '',
        useDataFiles: true,
      }),
    ).rejects.toMatchObject({ code: 'NO_PAYLOAD' });
  });
});
