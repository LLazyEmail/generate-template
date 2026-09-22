import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGenerator } from './generator';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('createGenerator', () => {
  it('renders from an injected function without touching the filesystem', () => {
    const gen = createGenerator({
      catalog: [
        {
          ids: ['welcome', 'WelcomeEmail'],
          render: (payload) => {
            const data = payload as { name: string };
            return `<h1>Hello ${data.name}</h1>`;
          },
        },
      ],
      samplePayloads: {
        welcome: { name: 'Alex' },
        WelcomeEmail: { name: 'Alex' },
      },
    });

    expect(gen.find('WELCOME')?.ids).toContain('welcome');
    expect(gen.render('welcome')).toBe('<h1>Hello Alex</h1>');
    expect(gen.render('WelcomeEmail', { payload: { name: 'Sam' } })).toBe('<h1>Hello Sam</h1>');
  });

  it('renders objects that expose .render()', () => {
    const gen = createGenerator({
      catalog: [
        {
          ids: ['invoice'],
          render: { render: (payload) => `<p>${(payload as { total: string }).total}</p>` },
        },
      ],
    });

    expect(gen.render('invoice', { payload: { total: '$49.00' } })).toBe('<p>$49.00</p>');
  });

  it('resolves paths from a consumer root, not this package', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-template-root-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'emails'));
    fs.writeFileSync(path.join(root, 'emails', 'hello.ts'), 'export const hello = () => "ok";\n');

    const gen = createGenerator({
      root,
      templatesDir: 'emails',
      catalog: [{ ids: ['hello'], file: 'hello.ts', exportName: 'hello' }],
    });

    expect(gen.templatesDir).toBe(path.join(root, 'emails'));
    expect(gen.listTemplateFiles()).toEqual(['hello.ts']);
  });

  it('writes rendered html through the generator', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-template-write-'));
    tempDirs.push(dir);
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: () => '<p>hi</p>' }],
      samplePayloads: { welcome: {} },
      outDir: path.join(dir, 'out'),
    });

    const written = gen.write('welcome');
    expect(written).toBe(path.resolve(dir, 'out', 'welcome.html'));
    expect(fs.readFileSync(written, 'utf8')).toBe('<p>hi</p>');
  });

  it('lists and rejects unknown ids using the supplied catalog only', () => {
    const gen = createGenerator({
      catalog: [{ ids: ['only'], render: () => 'x' }],
    });

    expect(() => gen.render('welcome', { payload: {} })).toThrow(/Unknown template id/);
  });

  it('handles missing templates directory gracefully', () => {
    const gen = createGenerator({
      templatesDir: '/nonexistent/templates',
      catalog: [{ ids: ['test'], render: () => 'test' }],
    });

    expect(gen.listTemplateFiles()).toEqual([]);
  });
});
