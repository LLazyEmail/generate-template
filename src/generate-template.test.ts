import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGenerator, DEFAULT_OUT_DIR } from './generator';
import { parseArgs } from './cli';
import { loadPayload, reviveDates, serializePayload } from './payload';
import { findEntry, slugFromId } from './resolve';
import type { TemplateCatalogEntry } from './types';

function writeHtml(outPath: string, html: string): string {
  const resolvedOutPath = path.resolve(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(resolvedOutPath), { recursive: true });
  fs.writeFileSync(resolvedOutPath, html, 'utf8');
  return resolvedOutPath;
}

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
    const testCatalog: TemplateCatalogEntry[] = [
      {
        ids: ['password-reset', 'PasswordResetEmail'],
        file: 'password-reset.definition.ts',
        exportName: 'passwordReset',
      },
    ];
    expect(findEntry(testCatalog, 'password-reset')?.exportName).toBe('passwordReset');
    expect(findEntry(testCatalog, 'PasswordResetEmail')?.file).toBe('password-reset.definition.ts');
  });

  it('builds slugs from catalog ids', () => {
    const testCatalog: TemplateCatalogEntry[] = [
      { ids: ['WelcomeEmail'], render: () => 'test' },
      { ids: ['password-reset'], render: () => 'test' },
    ];
    expect(slugFromId(testCatalog, 'WelcomeEmail')).toBe('welcome');
    expect(slugFromId(testCatalog, 'password-reset')).toBe('password-reset');
  });
});

describe('payloads', () => {
  it('loads sample payloads from generator config', async () => {
    const gen = createGenerator({
      catalog: [
        { ids: ['test1'], render: () => 'test1' },
        { ids: ['test2'], render: () => 'test2' },
      ],
      samplePayloads: {
        test1: { name: 'Test1' },
        test2: { name: 'Test2' },
      },
    });
    expect(await gen.loadPayload('test1')).toEqual({ name: 'Test1' });
    expect(await gen.loadPayload('test2')).toEqual({ name: 'Test2' });
  });

  it('loads a JSON payload from --data', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-template-data-'));
    tempDirs.push(dir);
    const dataPath = path.join(dir, 'custom.json');
    fs.writeFileSync(dataPath, JSON.stringify({ name: 'Pat' }));
    const gen = createGenerator({ catalog: [], samplePayloads: {} });
    expect(await gen.loadPayload('any-id', dataPath)).toEqual({ name: 'Pat' });
  });

  it('throws when no sample or data file exists', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['test'], render: () => 'test' }],
      samplePayloads: {},
    });
    await expect(gen.loadPayload('test')).rejects.toThrow(/Data directory does not exist|No payload for "test"/);
  });

  it('provides helpful error when data directory missing and no sample payload', async () => {
    await expect(
      loadPayload({
        templateId: 'test',
        catalog: [{ ids: ['test'], render: () => 'test' }],
        samplePayloads: {},
        dataDir: '/nonexistent/data/dir',
        allowMissingDirectories: true,
      })
    ).rejects.toThrow(/No payload for "test"/);
  });
});

describe('serializePayload / reviveDates', () => {
  it('round-trips Date values via __date', () => {
    const raw = serializePayload({ signupDate: new Date('2026-01-05T12:00:00Z'), name: 'Alex' });
    expect(raw).toContain('"__date":"2026-01-05T12:00:00.000Z"');
    const revived = reviveDates(JSON.parse(raw)) as { signupDate: Date; name: string };
    expect(revived.signupDate.toISOString()).toBe('2026-01-05T12:00:00.000Z');
  });
});

describe('render / files', () => {
  it('rejects unknown template ids before touching disk', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['test'], render: () => 'test' }],
    });
    await expect(gen.render('nope', { payload: {} })).rejects.toThrow(/Unknown template id/);
  });

  it('renders templates with inline render functions', async () => {
    const gen = createGenerator({
      catalog: [{
        ids: ['test-template'],
        render: (payload: { userName: string }) => `<h1>Welcome ${payload.userName}</h1>`,
      }],
      samplePayloads: {
        'test-template': { userName: 'TestUser' },
      },
    });
    expect(await gen.render('test-template')).toContain('Welcome TestUser');
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
