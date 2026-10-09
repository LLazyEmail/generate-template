import path from 'node:path';
import { pathExists } from 'markup-generator';
import { listTemplateFiles } from './adapters/list-files';
import {
  runAssertGenerated,
  slugsFileFromArgv,
  slugsFromArgv,
  slugsFromGenerator,
} from './assert-generated';
import { loadProjectGenerator } from './config';
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
    if (arg === '--help' || arg === '-h') {
      args.help = true;
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
  const targets = wantAll
    ? generator.catalog.map((entry) => entry.ids[0])
    : [args.template as string];
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

export function wantsAll(args: CliArgs): boolean {
  return args.all === true || !args.template || args.template === 'all';
}

async function resolveGenerator(
  generator: TemplateGenerator | undefined,
  args: CliArgs,
): Promise<TemplateGenerator> {
  return generator ?? (await loadProjectGenerator({ config: args.config })) ?? createGenerator();
}

function warnUncatalogued(gen: TemplateGenerator, templateFiles: string[]): void {
  if (!gen.templatesDir) return;
  const catalogFiles = new Set(gen.catalog.map((entry) => entry.file).filter(Boolean));
  const extra = templateFiles.filter((file) => !catalogFiles.has(file));
  if (extra.length) console.warn(`Warning: template files not in catalog: ${extra.join(', ')}`);
}

export const USAGE = `generate-template — render a project catalog to HTML

  generate-template --list
  generate-template --template=welcome --data=src/data/welcome.data.js --out=generated/welcome.html
  generate-template --all --out=generated
  generate-template assert --slugs-file=tests/fixtures/generated-slugs.json --out=generated

Config: --config=path, package.json "generateTemplate", or generate-template.config.js
The module must export createProjectGenerator(), generator, or a default function that returns one.
--help prints this message. With no flags and no config, nothing is generated.
`;

export async function main(
  argv = process.argv.slice(2),
  generator?: TemplateGenerator,
): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return;
  }
  if (argv[0] === 'assert') {
    await runAssertCommand(argv.slice(1), generator);
    return;
  }

  const args = parseArgs(argv);
  const gen = await resolveGenerator(generator, args);
  if (argv.length === 0 && gen.catalog.length === 0) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }
  const templatesDir = gen.templatesDir;
  const templateFiles = templatesDir
    ? listTemplateFiles(templatesDir, { skipFiles: gen.skipFiles })
    : [];

  if (args.list) {
    console.log(
      `Files in ${templatesDir ? path.relative(gen.root, templatesDir) || templatesDir : '(no templatesDir)'}:`,
    );
    templateFiles.forEach((file) => console.log(`  ${file}`));
    console.log('Generatable templates:');
    if (gen.catalog.length === 0) {
      console.log('  (No catalog configured — add generate-template.config.js or pass --config=)');
    } else {
      gen.catalog.forEach((entry) => {
        const exists = entry.render
          ? true
          : Boolean(entry.file && templatesDir && pathExists(path.join(templatesDir, entry.file)));
        const source = entry.render ? 'renderer' : (entry.file ?? '(no source)');
        console.log(`  ${entry.ids.join(' | ')}  <- ${source}${exists ? '' : ' (missing)'}`);
      });
    }
    return;
  }

  if (gen.catalog.length === 0) {
    console.error(
      'Error: No catalog configured. Add generate-template.config.js exporting createProjectGenerator(), or pass --config=.',
    );
    process.exitCode = 1;
    return;
  }

  if (wantsAll(args)) {
    const paths = await gen.writeAll(args.out || gen.outDir);
    paths.forEach((filePath) => console.log(filePath));
    warnUncatalogued(gen, templateFiles);
    return;
  }

  const [request] = requestsFromArgs(args, gen);
  const result = await gen.run(request);
  if (result.path) console.log(result.path);
}

async function runAssertCommand(argv: string[], generator?: TemplateGenerator): Promise<void> {
  const args = parseArgs(argv);
  const gen = generator ?? (await loadProjectGenerator({ config: args.config }));
  const slugs =
    slugsFromArgv(argv) ??
    (slugsFileFromArgv(argv) ? undefined : gen ? slugsFromGenerator(gen) : undefined);
  runAssertGenerated({ argv, slugs });
}
