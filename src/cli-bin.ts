#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from './cli';

const thisFile = fileURLToPath(import.meta.url);
const invokedAsCli = typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === thisFile;

if (invokedAsCli) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
