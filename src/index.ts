import { TemplateGenerator, DEFAULT_OUT_DIR } from './engine';
import { GenerateTemplateError, isGenerateTemplateError } from './engine/errors';
import type { GenerateTemplateErrorCode } from './engine/errors';

export { TemplateGenerator, DEFAULT_OUT_DIR };
export { GenerateTemplateError, isGenerateTemplateError };
export type { GenerateTemplateErrorCode };
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
  CliArgs,
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

export { createGenerator } from './create-generator';
export { loadProjectGenerator, findConfigPath, generatorFromModule } from './config';
export { parseArgs, requestsFromArgs, main, wantsAll } from './cli';
export {
  assertGenerated,
  formatAssertGenerated,
  outDirFromArgv,
  readSlugsFile,
  runAssertGenerated,
  slugsFileFromArgv,
  slugsFromArgv,
  slugsFromGenerator,
} from './assert-generated';
export type { AssertGeneratedOptions, AssertGeneratedResult, RunAssertGeneratedOptions } from './assert-generated';
