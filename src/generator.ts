import fs from 'node:fs';
import path from 'node:path';
import { createGenerator as createMarkupGenerator } from 'markup-generator';
import { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';
import { findEntry, slugFromId } from './resolve';
import type {
  GeneratorConfig,
  RenderOptions,
  TemplateCatalogEntry,
  WriteOptions,
} from './types';

const DEFAULT_SKIP = new Set(['index.js', 'index2.js', 'registry.ts', 'registry.js']);

export const DEFAULT_OUT_DIR = 'generated';

export class TemplateGenerator {
  readonly catalog: TemplateCatalogEntry[];
  readonly samplePayloads: Record<string, unknown>;
  readonly root: string;
  readonly templatesDir: string;
  readonly dataDir: string;
  readonly outDir: string;
  readonly skipFiles: Set<string>;
  private markupGenerator: any;

  constructor(config: GeneratorConfig = {}) {
    this.catalog = config.catalog ?? CATALOG;
    this.samplePayloads = config.samplePayloads ?? SAMPLE_PAYLOADS;
    this.root = path.resolve(config.root ?? process.cwd());
    this.templatesDir = path.resolve(this.root, config.templatesDir ?? path.join('src', 'templates'));
    this.dataDir = path.resolve(this.root, config.dataDir ?? path.join('src', 'data'));
    this.outDir = config.outDir ?? DEFAULT_OUT_DIR;
    this.skipFiles = new Set(config.skipFiles ?? [...DEFAULT_SKIP]);
    
    this.markupGenerator = createMarkupGenerator({
      templatesDir: path.relative(this.root, this.templatesDir),
      dataDir: path.relative(this.root, this.dataDir),
      outDir: this.outDir
    });
  }

  find(templateId: string): TemplateCatalogEntry | undefined {
    return findEntry(this.catalog, templateId);
  }

  slug(templateId: string): string {
    return slugFromId(this.catalog, templateId);
  }

  listTemplateFiles(): string[] {
    return this.markupGenerator.listTemplateFiles();
  }

  async loadPayload(templateId: string, dataPath?: string): Promise<unknown> {
    return await this.markupGenerator.loadPayload(templateId, dataPath);
  }

  async render(templateId: string, options: RenderOptions = {}): Promise<string> {
    const payload = options.payload ?? await this.loadPayload(templateId, options.dataPath);
    return await this.markupGenerator.render(templateId, { payload });
  }

  async writeHtml(outPath: string, html: string): Promise<string> {
    const resolvedOutPath = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(resolvedOutPath), { recursive: true });
    fs.writeFileSync(resolvedOutPath, html, 'utf8');
    return resolvedOutPath;
  }

  async write(templateId: string, options: WriteOptions = {}): Promise<string> {
    return await this.markupGenerator.write(templateId);
  }

  async writeAll(outDir = this.outDir): Promise<string[]> {
    const results: string[] = [];
    for (const entry of this.catalog) {
      const result = await this.write(entry.ids[0]);
      results.push(result);
    }
    return results;
  }
}

export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return new TemplateGenerator(config);
}
