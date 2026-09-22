import path from 'node:path';
import { writeGeneratedFile, resolveFromCwd } from 'markup-generator';
import { findEntry, slugFromId } from './resolve';
import { loadPayload } from './payload';
import { renderEntry } from './render';
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
  readonly allowMissingDirectories: boolean;

  constructor(config: GeneratorConfig = {}) {
    this.catalog = config.catalog ?? [];
    this.samplePayloads = config.samplePayloads ?? {};
    this.root = path.resolve(config.root ?? process.cwd());
    this.templatesDir = path.resolve(this.root, config.templatesDir ?? path.join('src', 'templates'));
    this.dataDir = path.resolve(this.root, config.dataDir ?? path.join('src', 'data'));
    this.outDir = config.outDir ?? DEFAULT_OUT_DIR;
    this.skipFiles = new Set(config.skipFiles ?? [...DEFAULT_SKIP]);
    this.allowMissingDirectories = config.allowMissingDirectories ?? false;
  }

  find(templateId: string): TemplateCatalogEntry | undefined {
    return findEntry(this.catalog, templateId);
  }

  slug(templateId: string): string {
    return slugFromId(this.catalog, templateId);
  }

  listTemplateFiles(): string[] {
    // Note: markup-generator doesn't have a direct equivalent for listing files
    // We keep the original implementation but could potentially use markup-generator's
    // resolveFromCwd for path resolution if needed
    const fs = require('node:fs');
    if (!fs.existsSync(this.templatesDir)) {
      return [];
    }
    try {
      return fs
        .readdirSync(this.templatesDir)
        .filter((name) => {
          if (this.skipFiles.has(name)) return false;
          if (/LATER\./i.test(name)) return false;
          return /\.(ts|js)$/.test(name);
        })
        .sort();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read templates directory ${this.templatesDir}: ${error.message}`);
      }
      throw error;
    }
  }

  loadPayload(templateId: string, dataPath?: string): unknown {
    return loadPayload({
      templateId,
      dataPath,
      catalog: this.catalog,
      samplePayloads: this.samplePayloads,
      dataDir: this.dataDir,
      allowMissingDirectories: this.allowMissingDirectories,
    });
  }

  render(templateId: string, options: RenderOptions = {}): string {
    const payload = options.payload ?? this.loadPayload(templateId, options.dataPath);
    return renderEntry({
      templateId,
      payload,
      catalog: this.catalog,
      templatesDir: this.templatesDir,
      root: this.root,
    });
  }

  async writeHtml(outPath: string, html: string): Promise<string> {
    const resolvedPath = resolveFromCwd(outPath);
    const dir = path.dirname(resolvedPath);
    const fileName = path.basename(resolvedPath);
    
    return await writeGeneratedFile({
      content: html,
      fileName: fileName,
      dir: dir,
    });
  }

  async write(templateId: string, options: WriteOptions = {}): Promise<string> {
    const html = this.render(templateId, options);
    const fileName = `${this.slug(templateId)}.html`;
    const outPath = options.out || path.join(this.outDir, fileName);
    return this.writeHtml(outPath, html);
  }

  async writeAll(outDir = this.outDir): Promise<string[]> {
    const results: string[] = [];
    for (const entry of this.catalog) {
      const result = await this.write(entry.ids[0], { out: path.join(outDir, `${this.slug(entry.ids[0])}.html`) });
      results.push(result);
    }
    return results;
  }
}

export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return new TemplateGenerator(config);
}

// Lazy initialization for default generator instance
// This is used by the compatibility layer to avoid issues with missing directories during import
let _defaultGenerator: TemplateGenerator | null = null;

export function getDefaultGenerator(): TemplateGenerator {
  if (!_defaultGenerator) {
    _defaultGenerator = createGenerator();
  }
  return _defaultGenerator;
}

export function resetDefaultGenerator(): void {
  _defaultGenerator = null;
}
