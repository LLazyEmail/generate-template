/**
 * Compatibility layer for the original project-local script API.
 * New code should use createGenerator() from the package root.
 * 
 * NOTE: This layer now requires consumers to provide catalog and payloads
 * since the library no longer includes default templates.
 * 
 * DEPRECATED: This compatibility layer is provided for migration purposes.
 * New code should use createGenerator() directly with custom configuration.
 */
import { createGenerator, DEFAULT_OUT_DIR, TemplateGenerator, getDefaultGenerator } from './generator';
import { findEntry as findEntryIn, slugFromId as slugIn } from './resolve';
import { loadPayload as loadPayloadIn, reviveDates, serializePayload } from './payload';
import { renderEntry } from './render';
import { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';
import { main as runCli, parseArgs } from './cli';
import type { CliArgs, TemplateCatalogEntry } from './types';

export { DEFAULT_OUT_DIR, parseArgs, reviveDates, serializePayload };
export type { CliArgs };

/**
 * @deprecated Use createGenerator() with custom configuration instead
 */
export const TEMPLATES_DIR = () => getDefaultGenerator().templatesDir;

/**
 * @deprecated Use createGenerator() with custom configuration instead
 */
export const DATA_DIR = () => getDefaultGenerator().dataDir;

/**
 * @deprecated Use generator.find() instead
 */
export function findEntry(templateId: string): TemplateCatalogEntry | undefined {
  return findEntryIn(CATALOG, templateId);
}

/**
 * @deprecated Use generator.slug() instead
 */
export function slugFromId(templateId: string): string {
  return slugIn(CATALOG, templateId);
}

/**
 * @deprecated Use generator.listTemplateFiles() instead
 */
export function listTemplateFiles(): string[] {
  return getDefaultGenerator().listTemplateFiles();
}

/**
 * @deprecated Use generator.loadPayload() instead
 */
export function loadPayload(templateId: string, dataPath?: string): unknown {
  return loadPayloadIn({
    templateId,
    dataPath,
    catalog: CATALOG,
    samplePayloads: SAMPLE_PAYLOADS,
    dataDir: getDefaultGenerator().dataDir,
  });
}

/**
 * @deprecated Use generator.writeHtml() instead
 */
export async function writeHtml(outPath: string, html: string): Promise<string> {
  return await getDefaultGenerator().writeHtml(outPath, html);
}

/**
 * @deprecated Use generator.render() instead
 */
export function renderOne(templateId: string, payload: unknown): string {
  return renderEntry({
    templateId,
    payload,
    catalog: CATALOG,
    templatesDir: getDefaultGenerator().templatesDir,
    root: getDefaultGenerator().root,
  });
}

/**
 * @deprecated Use createGenerator() and call main() on the instance instead
 */
export async function main(argv = process.argv.slice(2)): Promise<void> {
  await runCli(argv, getDefaultGenerator());
}

export { TemplateGenerator };
