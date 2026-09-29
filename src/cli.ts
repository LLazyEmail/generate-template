#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists } from 'markup-generator';
import { listTemplateFiles } from './adapters/list-files';
import { createGenerator } from './create-generator';
import type { TemplateGenerator } from './engine';
import type { CliArgs, GenerateRequest } from './engine/types';

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

export function requestsFromArgs(args: CliArgs, generator: TemplateGenerator): GenerateRequest[] {
  const wantAll = args.all === true || !args.template || args.template === 'all';
  const targets = wantAll ? generator.catalog.map((entry) => entry.ids[0]) : [args.template as string];
  return targets.map((templateId) => ({
    templateId,
    dataPath: wantAll ? undefined : args.data,
    write: {
      out: wantAll
        ? path.join(args.out || generator.outDir, `${generator.slug(templateId)}.html`)
        : args.out || path.join(generator.outDir, `${generator.slug(templateId)}.html`),
    },
  }));
}

export async function main(argv = process.argv.slice(2), generator?: TemplateGenerator): Promise<void> {
  const args = parseArgs(argv);
  const gen = generator ?? createGenerator();
  const templatesDir = gen.templatesDir;
  const templateFiles = templatesDir ? listTemplateFiles(templatesDir, { skipFiles: gen.skipFiles }) : [];

  if (args.list) {
    console.log(`Files in ${templatesDir ? path.relative(gen.root, templatesDir) || templatesDir : '(no templatesDir)'}:`);
    templateFiles.forEach((file) => console.log(`  ${file}`));
    console.log('Generatable templates:');
    if (gen.catalog.length === 0) {
      console.log('  (No catalog configured — pass createGenerator({ catalog }) from your project)');
    } else {
      gen.catalog.forEach((entry) => {
        const exists = entry.render
          ? true
          : Boolean(entry.file && templatesDir && pathExists(path.join(templatesDir, entry.file)));
        const source = entry.render ? 'renderer' : entry.file ?? '(no source)';
        console.log(`  ${entry.ids.join(' | ')}  <- ${source}${exists ? '' : ' (missing)'}`);
      });
    }
    return;
  }

  if (gen.catalog.length === 0) {
    console.error('Error: No catalog configured. Use createGenerator({ catalog }) from your project.');
    process.exitCode = 1;
    return;
  }

  for (const request of requestsFromArgs(args, gen)) {
    const result = await gen.run(request);
    if (result.path) console.log(result.path);
  }

  const wantAll = args.all === true || !args.template || args.template === 'all';
  if (wantAll && templatesDir) {
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
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
