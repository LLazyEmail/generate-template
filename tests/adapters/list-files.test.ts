import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { listTemplateFiles } from '../../src/adapters/list-files';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('listTemplateFiles adapter', () => {
  it('lists ts/js files and skips registry names', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-list-'));
    tempDirs.push(dir);
    fs.writeFileSync(path.join(dir, 'hello.ts'), '');
    fs.writeFileSync(path.join(dir, 'index.js'), '');
    expect(listTemplateFiles(dir, { skipFiles: ['index.js'] })).toEqual(['hello.ts']);
  });

  it('returns [] when the directory is missing', () => {
    expect(listTemplateFiles('/nonexistent/templates')).toEqual([]);
  });
});
