/**
 * Compatibility layer for the original project-local script API.
 * New code should use createGenerator() from the package root.
 */
import { createGenerator, DEFAULT_OUT_DIR, TemplateGenerator } from './generator';
import { findEntry as findEntryIn, slugFromId as slugIn } from './resolve';
import { loadPayload as loadPayloadIn, reviveDates, serializePayload } from './payload';
import { renderEntry } from './render';
import { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';
import { main as runCli, parseArgs } from './cli';
import type { CliArgs, TemplateCatalogEntry } from './types';

const defaultGenerator = createGenerator();

export { DEFAULT_OUT_DIR, parseArgs, reviveDates, serializePayload };
export type { CliArgs };

export const TEMPLATES_DIR = defaultGenerator.templatesDir;
export const DATA_DIR = defaultGenerator.dataDir;

export function findEntry(templateId: string): TemplateCatalogEntry | undefined {
  return findEntryIn(CATALOG, templateId);
}

export function slugFromId(templateId: string): string {
  return slugIn(CATALOG, templateId);
}

export function listTemplateFiles(): string[] {
  return defaultGenerator.listTemplateFiles();
}

export function loadPayload(templateId: string, dataPath?: string): unknown {
  return loadPayloadIn({
    templateId,
    dataPath,
    catalog: CATALOG,
    samplePayloads: SAMPLE_PAYLOADS,
    dataDir: defaultGenerator.dataDir,
  });
}

export function writeHtml(outPath: string, html: string): string {
  return defaultGenerator.writeHtml(outPath, html);
}

export function renderOne(templateId: string, payload: unknown): string {
  return renderEntry({
    templateId,
    payload,
    catalog: CATALOG,
    templatesDir: defaultGenerator.templatesDir,
    root: defaultGenerator.root,
  });
}

export function main(argv = process.argv.slice(2)): void {
  runCli(argv, defaultGenerator);
}

export { TemplateGenerator };
