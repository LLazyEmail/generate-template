import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGenerator } from '../src/generator';
import { EXAMPLE_CATALOG, EXAMPLE_SAMPLE_PAYLOADS } from './example-catalog';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('sandbox catalog works through the engine', () => {
  it('renders every template and writes html', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-sandbox-'));
    tempDirs.push(dir);
    const generate = createGenerator({
      catalog: EXAMPLE_CATALOG,
      samplePayloads: EXAMPLE_SAMPLE_PAYLOADS,
      outDir: dir,
    });

    expect(generate.catalog).toHaveLength(6);

    const welcome = await generate.run({ templateId: 'WelcomeEmail' });
    expect(welcome.html).toContain('Welcome, Alex');
    expect(welcome.path).toBeUndefined();

    const paths = [];
    for (const entry of generate.catalog) {
      const result = await generate.run({
        templateId: entry.ids[0],
        write: true,
      });
      expect(result.path).toBeTruthy();
      expect(fs.existsSync(result.path as string)).toBe(true);
      expect(fs.readFileSync(result.path as string, 'utf8').length).toBeGreaterThan(50);
      paths.push(result.path);
    }
    expect(paths).toHaveLength(6);
  });
});
