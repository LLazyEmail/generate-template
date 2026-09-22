// Main API
export { createGenerator, TemplateGenerator, DEFAULT_OUT_DIR } from './generator';
export type { GeneratorConfig, RenderOptions, TemplateRenderer, WriteOptions } from './types';

// Catalog and resolution
export { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';
export { findEntry, slugFromId, availableIds } from './resolve';
export type { TemplateCatalogEntry } from './types';

// Payload handling
export { loadPayload, reviveDates, serializePayload } from './payload';

// CLI
export { parseArgs, main } from './cli';
export type { CliArgs } from './types';

// Legacy/compatibility API - consider using createGenerator() instead
export {
  listTemplateFiles,
  renderOne,
  writeHtml,
  DEFAULT_OUT_DIR as LEGACY_DEFAULT_OUT_DIR,
  parseArgs as legacyParseArgs,
  reviveDates as legacyReviveDates,
  serializePayload as legacySerializePayload,
} from './generate-template';
export type { CliArgs as LegacyCliArgs } from './generate-template';

// Simple HTML generator (utility function)
export { generateTemplate, type GenerateTemplateOptions } from './html';
