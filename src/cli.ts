#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator, TemplateGenerator } from './generator';
import type { CliArgs } from './types';

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  argv.forEach((arg) => {
    if (arg === '--all') {
      args.all = true;
      return;
    }
    if (arg === '--list') {
      args.list = true;
      return;
    }
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      const key = match[1] as keyof CliArgs;
      (args as Record<string, string | boolean>)[key] = match[2] as string;
    }
  });
  return args;
}

export async function main(argv = process.argv.slice(2), generator?: TemplateGenerator): Promise<void> {
  const args = parseArgs(argv);
  const gen = generator ?? createGenerator();
  const templateFiles = gen.listTemplateFiles();

  if (args.list) {
    console.log(`Files in ${path.relative(gen.root, gen.templatesDir) || gen.templatesDir}:`);
    templateFiles.forEach((file) => console.log(`  ${file}`));
    console.log('Generatable templates:');
    if (gen.catalog.length === 0) {
      console.log('  (No catalog configured - use createGenerator() with catalog option)');
    } else {
      gen.catalog.forEach((entry) => {
        const exists = entry.render ? true : Boolean(entry.file && fs.existsSync(path.join(gen.templatesDir, entry.file)));
        const source = entry.render ? 'renderer' : entry.file ?? '(no source)';
        console.log(`  ${entry.ids.join(' | ')}  <- ${source}${exists ? '' : ' (missing)'}`);
      });
    }
    return;
  }

  if (gen.catalog.length === 0) {
    console.error('Error: No catalog configured. Use createGenerator() with catalog option.');
    process.exit(1);
  }

  const wantAll = args.all === true || !args.template || args.template === 'all';
  const targets = wantAll ? gen.catalog.map((entry) => entry.ids[0]) : [args.template as string];

  for (const templateId of targets) {
    const written = await gen.write(templateId, {
      dataPath: wantAll ? undefined : args.data,
      out: wantAll
        ? path.join(args.out || gen.outDir, `${gen.slug(templateId)}.html`)
        : args.out || path.join(gen.outDir, `${gen.slug(templateId)}.html`),
    });
    console.log(written);
  }

  if (wantAll) {
    const catalogFiles = new Set(gen.catalog.map((entry) => entry.file).filter(Boolean));
    const extra = templateFiles.filter((file) => !catalogFiles.has(file));
    if (extra.length) {
      console.warn(`Warning: template files not in catalog: ${extra.join(', ')}`);
    }
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsCli =
  typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === thisFile;

if (invokedAsCli) {
  main();
}
