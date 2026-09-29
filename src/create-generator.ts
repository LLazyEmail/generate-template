import { renderFromFile } from './adapters/file-renderer';
import { loadPayloadFromFiles } from './adapters/payload-files';
import { createEngine, TemplateGenerator } from './engine';
import type { GeneratorConfig } from './engine/types';

/** Package factory. Wires optional disk adapters. Engine itself does not import them. */
export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return createEngine({
    ...config,
    fileRenderer: config.fileRenderer ?? (config.allowFileTemplates ? renderFromFile : undefined),
    loadFromFiles: config.loadFromFiles ?? loadPayloadFromFiles,
  });
}
