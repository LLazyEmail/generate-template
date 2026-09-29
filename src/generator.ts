import fs from 'node:fs';
import path from 'node:path';
import { Catalog } from './catalog';
import { GenerateTemplateError } from './errors';
import { loadPayload } from './payload';
import { renderEntry } from './render';
import { Writer } from './writer';
import type {
  GenerateRequest,
  GenerateResult,
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
  readonly allowFileTemplates: boolean;
  readonly catalogPort: Catalog;
  readonly writer: Writer;

  constructor(config: GeneratorConfig = {}) {
    this.catalog = config.catalog ?? [];
    this.samplePayloads = config.samplePayloads ?? {};
    this.root = path.resolve(config.root ?? process.cwd());
    this.templatesDir = path.resolve(this.root, config.templatesDir ?? path.join('src', 'templates'));
    this.dataDir = path.resolve(this.root, config.dataDir ?? path.join('src', 'data'));
    this.outDir = config.outDir ?? DEFAULT_OUT_DIR;
    this.skipFiles = new Set(config.skipFiles ?? [...DEFAULT_SKIP]);
    this.allowMissingDirectories = config.allowMissingDirectories ?? false;
    this.allowFileTemplates = config.allowFileTemplates ?? false;
    this.catalogPort = new Catalog(this.catalog);
    this.writer = new Writer(this.outDir);
  }

  find(templateId: string): TemplateCatalogEntry | undefined {
    return this.catalogPort.find(templateId);
  }

  slug(templateId: string): string {
    return this.catalogPort.slug(templateId);
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
      const message = error instanceof Error ? error.message : String(error);
      throw new GenerateTemplateError(
        'INVALID_CONFIG',
        `Failed to read templates directory ${this.templatesDir}: ${message}`
      );
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
      allowFileTemplates: this.allowFileTemplates,
    });
  }

  writeHtml(outPath: string, html: string, templateId?: string): Promise<string> {
    return this.writer.writeFile(outPath, html, templateId);
  }

  write(templateId: string, options: WriteOptions = {}): Promise<string> {
    const html = this.render(templateId, options);
    return this.writer.writeNamed({
      templateId,
      html,
      slug: this.slug(templateId),
      out: options.out,
      uniqueName: options.uniqueName,
    });
  }

  async writeAll(outDir = this.outDir): Promise<string[]> {
    const paths: string[] = [];
    for (const entry of this.catalog) {
      paths.push(await this.write(entry.ids[0], { out: path.join(outDir, `${this.slug(entry.ids[0])}.html`) }));
    }
    return paths;
  }

  async run(request: GenerateRequest): Promise<GenerateResult> {
    const html = this.render(request.templateId, {
      payload: request.payload,
      dataPath: request.dataPath,
    });
    const result: GenerateResult = {
      templateId: request.templateId,
      html,
    };
    if (request.write) {
      const writeOpts = request.write === true ? {} : request.write;
      result.path = await this.write(request.templateId, {
        payload: request.payload,
        dataPath: request.dataPath,
        out: writeOpts.out,
        uniqueName: writeOpts.uniqueName,
      });
    }
    return result;
  }
}

export function createGenerator(config: GeneratorConfig = {}): TemplateGenerator {
  return new TemplateGenerator(config);
}
