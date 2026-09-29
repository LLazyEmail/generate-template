/**
 * Proof the engine works against real sandbox templates.
 * Run: npm run sandbox
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator, GenerateTemplateError } from '../dist/index.js';
import { EXAMPLE_CATALOG, EXAMPLE_SAMPLE_PAYLOADS } from './example-catalog.ts';

const sandboxRoot = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(sandboxRoot, 'generated');

const generate = createGenerator({
  root: sandboxRoot,
  catalog: EXAMPLE_CATALOG,
  samplePayloads: EXAMPLE_SAMPLE_PAYLOADS,
  outDir,
});

async function main(): Promise<void> {
  console.log('templates:', generate.catalog.map((e) => e.ids[0]).join(', '));

  const preview = await generate.run({ templateId: 'welcome' });
  if (!preview.html.includes('Welcome, Alex')) {
    throw new Error('welcome preview did not contain expected text');
  }
  console.log('run(welcome) html length:', preview.html.length);

  const custom = await generate.run({
    templateId: 'invoice',
    payload: {
      ...EXAMPLE_SAMPLE_PAYLOADS.invoice,
      name: 'Pat',
      invoice_id: 'INV-SANDBOX',
    },
  });
  if (!custom.html.includes('INV-SANDBOX') || !custom.html.includes('Pat')) {
    throw new Error('invoice custom payload was not applied');
  }
  console.log('run(invoice, custom payload) ok');

  const written: string[] = [];
  for (const entry of generate.catalog) {
    const result = await generate.run({
      templateId: entry.ids[0],
      write: { out: path.join(outDir, `${generate.slug(entry.ids[0])}.html`) },
    });
    if (!result.path || !fs.existsSync(result.path)) {
      throw new Error(`missing file for ${entry.ids[0]}`);
    }
    written.push(result.path);
    console.log('wrote', path.relative(sandboxRoot, result.path), fs.statSync(result.path).size, 'bytes');
  }

  try {
    await generate.run({ templateId: 'does-not-exist', payload: {} });
    throw new Error('expected UNKNOWN_TEMPLATE');
  } catch (error) {
    if (!(error instanceof GenerateTemplateError) || error.code !== 'UNKNOWN_TEMPLATE') {
      throw error;
    }
    console.log('UNKNOWN_TEMPLATE surfaced as expected');
  }

  console.log(`sandbox ok — ${written.length} files in sandbox/generated/`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
