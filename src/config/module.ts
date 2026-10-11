import type { TemplateGenerator } from '../engine';

export function isTemplateGenerator(value: unknown): value is TemplateGenerator {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TemplateGenerator>;
  return (
    typeof candidate.run === 'function' &&
    typeof candidate.writeAll === 'function' &&
    Array.isArray(candidate.catalog)
  );
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
