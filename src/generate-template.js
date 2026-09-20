#!/usr/bin/env node
/**
 * Thin wrapper so `node scripts/generate-template.js` still works.
 * The implementation lives in generate-template.ts.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const result = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--no-warnings',
    path.join(__dirname, 'generate-template.ts'),
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);
