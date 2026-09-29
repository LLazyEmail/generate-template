export { createGenerator, TemplateGenerator, DEFAULT_OUT_DIR } from './generator';
export type { GeneratorConfig, RenderOptions, TemplateRenderer, WriteOptions } from './types';

export { findEntry, slugFromId, availableIds } from './resolve';
export type { TemplateCatalogEntry } from './types';

export { loadPayload, reviveDates, serializePayload } from './payload';

export { parseArgs, main } from './cli';
export type { CliArgs } from './types';

export { generateTemplate, type GenerateTemplateOptions } from './html';

export {
  writeGeneratedFile,
  writeGeneratedEmail,
  generateFileName,
  MarkupGeneratorError,
} from 'markup-generator';
