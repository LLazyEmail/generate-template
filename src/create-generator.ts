import { renderFromFile } from './adapters/file-renderer';
import { loadPayloadFromFiles } from './adapters/payload-files';
import { createEngine, TemplateGenerator } from './engine';
import type { GeneratorConfig } from './engine/types';

/** The only package factory. Wires disk adapters the engine does not import. */
export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return createEngine({
    ...config,
    fileRenderer: config.fileRenderer ?? (config.allowFileTemplates ? renderFromFile : undefined),
    loadFromFiles: config.loadFromFiles ?? loadPayloadFromFiles,
  });
}
