/**
 * Compatibility layer. Prefer createGenerator() from the package root.
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

export const TEMPLATES_DIR = () => getDefaultGenerator().templatesDir;
export const DATA_DIR = () => getDefaultGenerator().dataDir;

export function findEntry(templateId: string): TemplateCatalogEntry | undefined {
  return findEntryIn(CATALOG, templateId);
}

export function slugFromId(templateId: string): string {
  return slugIn(CATALOG, templateId);
}

export function listTemplateFiles(): string[] {
  return getDefaultGenerator().listTemplateFiles();
}

export function loadPayload(templateId: string, dataPath?: string): unknown {
  return loadPayloadIn({
    templateId,
    dataPath,
    catalog: CATALOG,
    samplePayloads: SAMPLE_PAYLOADS,
    dataDir: getDefaultGenerator().dataDir,
  });
}

export function writeHtml(outPath: string, html: string): Promise<string> {
  return getDefaultGenerator().writeHtml(outPath, html);
}

export function renderOne(templateId: string, payload: unknown): string {
  return renderEntry({
    templateId,
    payload,
    catalog: CATALOG,
    templatesDir: getDefaultGenerator().templatesDir,
    root: getDefaultGenerator().root,
  });
}

export function main(argv = process.argv.slice(2)): Promise<void> {
  return runCli(argv, getDefaultGenerator());
}

export { TemplateGenerator, createGenerator };
