export { generateTemplate, type GenerateTemplateOptions } from './html';
export { CATALOG, SAMPLE_PAYLOADS, type TemplateCatalogEntry } from './template-catalog';
export { createGenerator, TemplateGenerator, DEFAULT_OUT_DIR } from './generator';
export { findEntry, slugFromId, availableIds } from './resolve';
export { loadPayload, reviveDates, serializePayload } from './payload';
export { parseArgs, main } from './cli';
export type { CliArgs, GeneratorConfig, RenderOptions, TemplateRenderer, WriteOptions } from './types';

export {
  listTemplateFiles,
  renderOne,
  writeHtml,
} from './generate-template';
