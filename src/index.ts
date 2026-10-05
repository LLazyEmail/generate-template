import { renderFromFile } from './adapters/file-renderer';
import { loadPayloadFromFiles } from './adapters/payload-files';
import { createEngine, TemplateGenerator, DEFAULT_OUT_DIR } from './engine';
import { GenerateTemplateError, isGenerateTemplateError } from './engine/errors';
import type { GenerateTemplateErrorCode } from './engine/errors';
import type { GeneratorConfig } from './engine/types';

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

export { parseArgs, requestsFromArgs, main } from './cli';
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

/** Package factory. Wires optional disk adapters. Engine does not import them. */
export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return createEngine({
    ...config,
    fileRenderer: config.fileRenderer ?? (config.allowFileTemplates ? renderFromFile : undefined),
    loadFromFiles: config.loadFromFiles ?? loadPayloadFromFiles,
  });
}
