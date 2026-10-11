import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { TemplateGenerator } from '../engine';
import { findConfigPath } from './find-config';
import { generatorFromModule } from './module';

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
    return await loadFromModule(file, imported);
  } catch (error) {
    throw describeConfigError(file, error);
  }
}

async function loadFromModule(
  file: string,
  mod: Record<string, unknown>,
): Promise<TemplateGenerator> {
  try {
    return await generatorFromModule(mod);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid config ${file}: ${message}`);
  }
}

function describeConfigError(file: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (file.endsWith('.ts') && /unknown file extension|ERR_UNKNOWN_FILE_EXTENSION/i.test(message)) {
    return new Error(`Cannot import ${file}. Node >= 22.18 is required for a .ts config.`);
  }
  return error instanceof Error ? error : new Error(message);
}
