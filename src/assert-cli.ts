#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAssertGenerated } from './assert-generated';

const thisFile = fileURLToPath(import.meta.url);
const invokedAsCli = typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === thisFile;

if (invokedAsCli) {
  try {
    runAssertGenerated();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
