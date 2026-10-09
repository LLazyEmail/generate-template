import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('publish surface', () => {
  it('packs dist and docs, not the sandbox or sources', () => {
    const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: root,
      encoding: 'utf8',
    });
    const packed = JSON.parse(raw) as Array<{ files?: Array<{ path: string }> }>;
    const paths = (packed[0]?.files ?? []).map((file) => file.path.replace(/^package\//, ''));

    expect(paths.some((file) => file === 'README.md' || file.endsWith('/README.md'))).toBe(true);
    expect(paths.some((file) => file.startsWith('dist/'))).toBe(true);
    expect(paths.some((file) => file.startsWith('sandbox/'))).toBe(false);
    expect(paths.some((file) => file.startsWith('tests/'))).toBe(false);
    expect(paths.some((file) => file.startsWith('src/'))).toBe(false);
  });
});
