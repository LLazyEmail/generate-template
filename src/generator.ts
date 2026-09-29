import fs from 'node:fs';
import path from 'node:path';
import { generateFileName, writeGeneratedEmail, writeGeneratedFile } from 'markup-generator';
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
    if (!fs.existsSync(this.templatesDir)) {
      return [];
    }
    try {
      return fs
        .readdirSync(this.templatesDir)
        .filter((name: string) => {
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
    const resolvedOutPath = path.resolve(process.cwd(), outPath);
    return writeGeneratedFile({
      content: html,
      fileName: path.basename(resolvedOutPath),
      dir: path.dirname(resolvedOutPath),
    });
  }

  async write(templateId: string, options: WriteOptions = {}): Promise<string> {
    const html = this.render(templateId, options);
    const stableName = `${this.slug(templateId)}.html`;
    const fileName = options.uniqueName ? generateFileName(this.slug(templateId), 'html') : stableName;

    if (options.out) {
      const resolved = path.resolve(process.cwd(), options.out);
      const looksLikeFile = path.extname(resolved) !== '';
      const dir = looksLikeFile ? path.dirname(resolved) : resolved;
      const name = looksLikeFile ? path.basename(resolved) : fileName;
      return writeGeneratedFile({
        content: html,
        fileName: name,
        dir,
      });
    }

    const written = await writeGeneratedEmail({
      content: html,
      fileName,
      label: templateId,
      dir: this.outDir,
    });
    if (!written) {
      throw new Error(`Failed to write ${fileName}`);
    }
    return written;
  }

  async writeAll(outDir = this.outDir): Promise<string[]> {
    const paths: string[] = [];
    for (const entry of this.catalog) {
      paths.push(await this.write(entry.ids[0], { out: path.join(outDir, `${this.slug(entry.ids[0])}.html`) }));
    }
    return paths;
  }
}

export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return new TemplateGenerator(config);
}

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
