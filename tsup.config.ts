import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    target: 'node20',
    outDir: 'dist',
    platform: 'node',
  },
  {
    entry: {
      cli: 'src/generate-template.ts',
    },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
    target: 'node20',
    outDir: 'dist',
    platform: 'node',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
