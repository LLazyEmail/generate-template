import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const CONFIG_CANDIDATES = [
  'generate-template.config.js',
  'generate-template.config.mjs',
  'generate-template.config.cjs',
  'generate-template.config.ts',
] as const;

function packageGeneratorPath(cwd: string): string | undefined {
  const pkgPath = path.join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return undefined;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { generateTemplate?: unknown };
  if (typeof pkg.generateTemplate !== 'string' || pkg.generateTemplate.length === 0) {
    return undefined;
  }
  return path.resolve(cwd, pkg.generateTemplate);
}

export function findConfigPath(cwd: string, explicit?: string): string | undefined {
  if (explicit) return path.resolve(cwd, explicit);
  const fromPackage = packageGeneratorPath(cwd);
  if (fromPackage) return fromPackage;
  return CONFIG_CANDIDATES.map((name) => path.join(cwd, name)).find((file) => existsSync(file));
}
