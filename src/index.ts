// Main API
export { createGenerator, TemplateGenerator, DEFAULT_OUT_DIR } from './generator';
export type { GeneratorConfig, RenderOptions, TemplateRenderer, WriteOptions } from './types';

// Catalog and resolution utilities
export { findEntry, slugFromId, availableIds } from './resolve';
export type { TemplateCatalogEntry } from './types';

// Payload handling utilities
export { loadPayload, reviveDates, serializePayload } from './payload';

// CLI
export { parseArgs, main } from './cli';
export type { CliArgs } from './types';

// Simple HTML generator (utility function)
export { generateTemplate, type GenerateTemplateOptions } from './html';
