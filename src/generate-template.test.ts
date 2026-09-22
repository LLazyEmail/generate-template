import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';
import {
  DEFAULT_OUT_DIR,
  findEntry,
  listTemplateFiles,
  loadPayload,
  parseArgs,
  renderOne,
  reviveDates,
  serializePayload,
  slugFromId,
  writeHtml,
} from './generate-template';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('parseArgs', () => {
  it('parses flags and key=value options', () => {
    expect(parseArgs(['--all', '--list', '--template=welcome', '--data=./payload.json', '--out=out'])).toEqual({
      all: true,
      list: true,
      template: 'welcome',
      data: './payload.json',
      out: 'out',
    });
  });

  it('ignores unknown bare tokens', () => {
    expect(parseArgs(['welcome', '--unknown'])).toEqual({});
  });
});

describe('catalog lookup', () => {
  it('resolves aliases case-insensitively', () => {
    expect(findEntry('password-reset')?.exportName).toBe('passwordReset');
    expect(findEntry('PasswordResetEmail')?.file).toBe('password-reset.definition.ts');
    expect(findEntry('WELCOME')?.ids).toContain('WelcomeEmail');
  });

  it('returns undefined for unknown ids', () => {
    expect(findEntry('not-a-template')).toBeUndefined();
  });

  it('builds slugs from catalog ids', () => {
    expect(slugFromId('WelcomeEmail')).toBe('welcome');
    expect(slugFromId('password-reset')).toBe('password-reset');
    expect(slugFromId('UnknownThing')).toBe('unknown-thing');
  });
});

describe('payloads', () => {
  it('loads built-in sample payloads for every catalog id', () => {
    for (const entry of CATALOG) {
      for (const id of entry.ids) {
        expect(loadPayload(id)).toBe(SAMPLE_PAYLOADS[id]);
      }
    }
  });

  it('loads a JSON payload from --data', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-template-data-'));
    tempDirs.push(dir);
    const dataPath = path.join(dir, 'custom.json');
    fs.writeFileSync(dataPath, JSON.stringify({ name: 'Pat' }));

    expect(loadPayload('welcome', dataPath)).toEqual({ name: 'Pat' });
  });

  it('throws when no sample or data file exists', () => {
    expect(() => loadPayload('missing-template')).toThrow(/No payload for "missing-template"/);
  });
});

describe('serializePayload / reviveDates', () => {
  it('round-trips Date values via __date', () => {
    const raw = serializePayload({ signupDate: new Date('2026-01-05T12:00:00Z'), name: 'Alex' });
    expect(raw).toContain('"__date":"2026-01-05T12:00:00.000Z"');

    const revived = reviveDates(JSON.parse(raw)) as { signupDate: Date; name: string };
    expect(revived.name).toBe('Alex');
    expect(revived.signupDate).toBeInstanceOf(Date);
    expect(revived.signupDate.toISOString()).toBe('2026-01-05T12:00:00.000Z');
  });

  it('revives ISO date strings and nested arrays', () => {
    const revived = reviveDates({
      items: [{ at: '2026-02-01T00:00:00.000Z' }],
    }) as { items: Array<{ at: Date }> };

    expect(revived.items[0].at).toBeInstanceOf(Date);
  });
});

describe('render / files', () => {
  it('lists no templates when src/templates is absent', () => {
    expect(listTemplateFiles()).toEqual([]);
  });

  it('rejects unknown template ids before touching disk', () => {
    expect(() => renderOne('nope', {})).toThrow(/Unknown template id/);
  });

  it('rejects catalog entries whose template file is missing', () => {
    expect(() => renderOne('welcome', SAMPLE_PAYLOADS.WelcomeEmail)).toThrow(/Template file missing/);
  });

  it('writes html under the resolved output path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-template-out-'));
    tempDirs.push(dir);
    const outPath = path.join(dir, DEFAULT_OUT_DIR, 'welcome.html');
    const written = writeHtml(outPath, '<html>ok</html>');

    expect(written).toBe(path.resolve(outPath));
    expect(fs.readFileSync(written, 'utf8')).toBe('<html>ok</html>');
  });
});
