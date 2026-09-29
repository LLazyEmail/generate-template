export { createGenerator, TemplateGenerator, DEFAULT_OUT_DIR } from './generator';
export { Catalog } from './catalog';
export { Writer } from './writer';
export { GenerateTemplateError, isGenerateTemplateError } from './errors';
export type { GenerateTemplateErrorCode } from './errors';
export type {
  GeneratorConfig,
  RenderOptions,
  TemplateRenderer,
  WriteOptions,
  GenerateRequest,
  GenerateResult,
  GenerateWriteOptions,
  TemplateCatalogEntry,
  CliArgs,
} from './types';

export { findEntry, slugFromId, availableIds } from './resolve';
export { loadPayload, reviveDates, serializePayload } from './payload';
export { parseArgs, main } from './cli';
export { generateTemplate, type GenerateTemplateOptions } from './html';
export { renderEntry, invokeRenderer, renderFromFile } from './render';

export {
  writeGeneratedFile,
  writeGeneratedEmail,
  generateFileName,
  MarkupGeneratorError,
} from 'markup-generator';
