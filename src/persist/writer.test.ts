import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Writer } from './writer';
import { GenerateTemplateError } from '../errors';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Writer port', () => {
  it('writes a stable path via markup-generator', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-writer-'));
    tempDirs.push(dir);
    const writer = new Writer(path.join(dir, 'generated'));
    const out = await writer.writeNamed({
      templateId: 'welcome',
      html: '<p>hi</p>',
      slug: 'welcome',
      out: path.join(dir, 'welcome.html'),
    });
    expect(out).toBe(path.resolve(dir, 'welcome.html'));
    expect(fs.readFileSync(out, 'utf8')).toBe('<p>hi</p>');
  });

  it('maps empty content to WRITE_FAILED', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-writer-empty-'));
    tempDirs.push(dir);
    const writer = new Writer(dir);
    await expect(
      writer.writeNamed({ templateId: 'x', html: '', slug: 'x', out: path.join(dir, 'x.html') })
    ).rejects.toMatchObject({ code: 'WRITE_FAILED' } satisfies Partial<GenerateTemplateError>);
  });

  it('appends a uuid when uniqueName is set', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-writer-unique-'));
    tempDirs.push(dir);
    const writer = new Writer(dir);
    const out = await writer.writeNamed({
      templateId: 'welcome',
      html: '<p>u</p>',
      slug: 'welcome',
      out: dir,
      uniqueName: true,
    });
    expect(path.basename(out)).toMatch(/^welcome-[0-9a-f-]{36}\.html$/);
    expect(fs.readFileSync(out, 'utf8')).toBe('<p>u</p>');
  });
});
