export { createGenerator } from './create-generator';
export { TemplateGenerator, DEFAULT_OUT_DIR } from './engine';
export { GenerateTemplateError, isGenerateTemplateError } from './engine/errors';
export type { GenerateTemplateErrorCode } from './engine/errors';
export type {
  GeneratorConfig,
  RenderOptions,
  TemplateRenderer,
  PayloadLoader,
  WriteOptions,
  GenerateRequest,
  GenerateResult,
  GenerateWriteOptions,
  TemplateCatalogEntry,
} from './engine/types';

export {
  writeGeneratedFile,
  writeGeneratedEmail,
  generateFileName,
  MarkupGeneratorError,
  pathExists,
  listTemplateFiles,
  loadData,
} from 'markup-generator';
