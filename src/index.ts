export { createGenerator, TemplateGenerator, DEFAULT_OUT_DIR } from './generator';
export { GenerateTemplateError, isGenerateTemplateError } from './errors';
export type { GenerateTemplateErrorCode } from './errors';
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
} from './types';

export {
  writeGeneratedFile,
  writeGeneratedEmail,
  generateFileName,
  MarkupGeneratorError,
} from 'markup-generator';
