import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGenerator, DEFAULT_OUT_DIR } from './generator';
import { parseArgs } from './cli';
import { loadPayload, reviveDates, serializePayload } from './payload';
import { findEntry, slugFromId, availableIds } from './resolve';
import { loadPayload as loadPayloadDirect } from './payload';
import type { TemplateCatalogEntry } from './types';

// Helper function for HTML writing in tests
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
    expect(findEntry(testCatalog, 'PASSWORD-RESET')?.ids).toContain('password-reset');
  });

  it('returns undefined for unknown ids', () => {
    expect(findEntry([], 'not-a-template')).toBeUndefined();
  });

  it('builds slugs from catalog ids', () => {
    const testCatalog: TemplateCatalogEntry[] = [
      { ids: ['WelcomeEmail'], render: () => 'test' },
      { ids: ['password-reset'], render: () => 'test' },
    ];
    
    expect(slugFromId(testCatalog, 'WelcomeEmail')).toBe('welcome');
    expect(slugFromId(testCatalog, 'password-reset')).toBe('password-reset');
    expect(slugFromId(testCatalog, 'UnknownThing')).toBe('unknown-thing');
  });

  it('throws error when catalog is not an array', () => {
    expect(() => findEntry(null as any, 'test')).toThrow('catalog must be an array');
    expect(() => findEntry(undefined as any, 'test')).toThrow('catalog must be an array');
  });
});

describe('payloads', () => {
  it('loads sample payloads from generator config', () => {
    const testCatalog: TemplateCatalogEntry[] = [
      { ids: ['test1'], render: () => 'test1' },
      { ids: ['test2'], render: () => 'test2' },
    ];
    const testSamplePayloads = {
      test1: { name: 'Test1' },
      test2: { name: 'Test2' },
    };
    
    const gen = createGenerator({
      catalog: testCatalog,
      samplePayloads: testSamplePayloads,
    });
    
    expect(gen.loadPayload('test1')).toEqual({ name: 'Test1' });
    expect(gen.loadPayload('test2')).toEqual({ name: 'Test2' });
  });

  it('loads a JSON payload from --data', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-template-data-'));
    tempDirs.push(dir);
    const dataPath = path.join(dir, 'custom.json');
    fs.writeFileSync(dataPath, JSON.stringify({ name: 'Pat' }));

    const gen = createGenerator({ catalog: [], samplePayloads: {} });
    expect(gen.loadPayload('any-id', dataPath)).toEqual({ name: 'Pat' });
  });

  it('throws when no sample or data file exists', () => {
    const gen = createGenerator({
      catalog: [{ ids: ['test'], render: () => 'test' }],
      samplePayloads: {},
    });
    expect(() => gen.loadPayload('test')).toThrow(/Data directory does not exist|No payload for "test"/);
  });

  it('handles missing data directory gracefully when using sample payloads', () => {
    const gen = createGenerator({
      catalog: [{ ids: ['test'], render: () => 'test' }],
      samplePayloads: { test: { data: 'sample' } },
    });
    
    const payload = gen.loadPayload('test');
    expect(payload).toEqual({ data: 'sample' });
  });

  it('provides helpful error when data directory missing and no sample payload', () => {
    expect(() => {
      loadPayloadDirect({
        templateId: 'test',
        catalog: [{ ids: ['test'], render: () => 'test' }],
        samplePayloads: {},
        dataDir: '/nonexistent/data/dir',
        allowMissingDirectories: true,
      });
    }).toThrow(/No payload for "test"/);
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

  it('handles generic date fields without special casing', () => {
    const revived = reviveDates({
      createdAt: new Date('2026-01-05T12:00:00Z'),
      updatedAt: '2026-02-01T00:00:00.000Z',
      name: 'Test'
    }) as { createdAt: Date; updatedAt: Date; name: string };

    expect(revived.createdAt).toBeInstanceOf(Date);
    expect(revived.updatedAt).toBeInstanceOf(Date);
    expect(revived.name).toBe('Test');
  });
});

describe('render / files', () => {
  it('lists no templates when templates directory is absent', () => {
    const gen = createGenerator({
      templatesDir: '/nonexistent/templates',
      catalog: [],
    });
    expect(gen.listTemplateFiles()).toEqual([]);
  });

  it('rejects unknown template ids before touching disk', () => {
    const gen = createGenerator({
      catalog: [{ ids: ['test'], render: () => 'test' }],
    });
    expect(() => gen.render('nope', { payload: {} })).toThrow(/Unknown template id/);
  });

  it('renders templates with inline render functions', () => {
    const gen = createGenerator({
      catalog: [{
        ids: ['test-template'],
        render: (payload: any) => `<h1>Welcome ${payload.userName}</h1>`,
      }],
      samplePayloads: {
        'test-template': { userName: 'TestUser' },
      },
    });
    
    const html = gen.render('test-template');
    expect(html).toContain('Welcome TestUser');
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
