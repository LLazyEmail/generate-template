import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { TemplateGenerator } from './engine';

export const CONFIG_CANDIDATES = [
  'generate-template.config.js',
  'generate-template.config.mjs',
  'generate-template.config.cjs',
  'generate-template.config.ts',
] as const;

export function isTemplateGenerator(value: unknown): value is TemplateGenerator {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TemplateGenerator>;
  return (
    typeof candidate.run === 'function' &&
    typeof candidate.writeAll === 'function' &&
    Array.isArray(candidate.catalog)
  );
}

export function findConfigPath(cwd: string, explicit?: string): string | undefined {
  if (explicit) return path.resolve(cwd, explicit);
  const pkgPath = path.join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { generateTemplate?: unknown };
    if (typeof pkg.generateTemplate === 'string' && pkg.generateTemplate.length > 0) {
      return path.resolve(cwd, pkg.generateTemplate);
    }
  }
  return CONFIG_CANDIDATES.map((name) => path.join(cwd, name)).find((file) => existsSync(file));
}

export async function generatorFromModule(
  mod: Record<string, unknown>,
): Promise<TemplateGenerator> {
  const exported = mod.createProjectGenerator ?? mod.generator ?? mod.default;
  const value = typeof exported === 'function' ? await exported() : exported;
  if (!isTemplateGenerator(value)) {
    throw new Error(
      'Config must export createProjectGenerator(), a generator, or a default function that returns one.',
    );
  }
  return value;
}

/**
 * Load the project catalog for the bin.
 * Order: `--config=`, package.json `generateTemplate`, then generate-template.config.{js,mjs,cjs,ts}.
 * `.ts` configs import on Node >= 22.18.
 */
export async function loadProjectGenerator(
  options: { cwd?: string; config?: string } = {},
): Promise<TemplateGenerator | undefined> {
  const cwd = options.cwd ?? process.cwd();
  const file = findConfigPath(cwd, options.config);
  if (!file) return undefined;
  if (!existsSync(file)) throw new Error(`Config not found: ${file}`);
  try {
    const imported = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
    try {
      return await generatorFromModule(imported);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid config ${file}: ${message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      file.endsWith('.ts') &&
      /unknown file extension|ERR_UNKNOWN_FILE_EXTENSION/i.test(message)
    ) {
      throw new Error(`Cannot import ${file}. Node >= 22.18 is required for a .ts config.`);
    }
    throw error;
  }
}
