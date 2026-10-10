import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function packPaths(): string[] {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  const jsonStart = raw.indexOf('[');
  if (jsonStart === -1) throw new Error(`npm pack did not return JSON:\n${raw}`);
  const packed = JSON.parse(raw.slice(jsonStart)) as Array<{ files?: Array<{ path: string }> }>;
  return (packed[0]?.files ?? []).map((file) => file.path.replace(/^package\//, ''));
}

describe('publish surface', () => {
  it('packs dist, bins, and docs, not the sandbox or sources', () => {
    const paths = packPaths();
    const listed = paths.join('\n');

    expect(paths, listed).toEqual(expect.arrayContaining(['README.md', 'LICENSE', 'package.json']));
    expect(
      paths.some((file) => file.startsWith('dist/')),
      `expected dist/ in the tarball:\n${listed}`,
    ).toBe(true);
    expect(paths, listed).toEqual(
      expect.arrayContaining(['dist/cli.js', 'dist/assert-cli.js', 'dist/index.js', 'dist/index.cjs']),
    );
    expect(
      paths.some((file) => file.startsWith('sandbox/')),
      `sandbox leaked into the tarball:\n${listed}`,
    ).toBe(false);
    expect(
      paths.some((file) => file.startsWith('tests/')),
      `tests leaked into the tarball:\n${listed}`,
    ).toBe(false);
    expect(
      paths.some((file) => file.startsWith('src/')),
      `src leaked into the tarball:\n${listed}`,
    ).toBe(false);
  });
});
