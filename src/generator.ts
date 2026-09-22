import fs from 'node:fs';
import path from 'node:path';
import { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';
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
    this.catalog = config.catalog ?? CATALOG;
    this.samplePayloads = config.samplePayloads ?? SAMPLE_PAYLOADS;
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

  writeHtml(outPath: string, html: string): string {
    const resolvedOutPath = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(resolvedOutPath), { recursive: true });
    fs.writeFileSync(resolvedOutPath, html, 'utf8');
    return resolvedOutPath;
  }

  write(templateId: string, options: WriteOptions = {}): string {
    const html = this.render(templateId, options);
    const fileName = `${this.slug(templateId)}.html`;
    const outPath = options.out || path.join(this.outDir, fileName);
    return this.writeHtml(outPath, html);
  }

  writeAll(outDir = this.outDir): string[] {
    return this.catalog.map((entry) => this.write(entry.ids[0], { out: path.join(outDir, `${this.slug(entry.ids[0])}.html`) }));
  }
}

export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return new TemplateGenerator(config);
}
