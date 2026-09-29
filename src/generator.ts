import path from 'node:path';
import { Catalog } from './catalog';
import { renderFromFile } from './adapters/file-renderer';
import { PayloadSource } from './payload';
import { renderEntry } from './render';
import { Writer } from './persist';
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
  readonly reviveDates: boolean;
  readonly useDataFiles: boolean;
  readonly catalogPort: Catalog;
  readonly writer: Writer;
  readonly payloads: PayloadSource;

  constructor(config: GeneratorConfig = {}) {
    this.catalog = config.catalog ?? [];
    this.samplePayloads = config.samplePayloads ?? {};
    this.root = path.resolve(config.root ?? process.cwd());
    this.templatesDir = config.templatesDir
      ? path.resolve(this.root, config.templatesDir)
      : path.resolve(this.root, 'src', 'templates');
    this.dataDir = config.dataDir
      ? path.resolve(this.root, config.dataDir)
      : path.resolve(this.root, 'src', 'data');
    this.outDir = config.outDir ?? DEFAULT_OUT_DIR;
    this.skipFiles = new Set(config.skipFiles ?? [...DEFAULT_SKIP]);
    this.allowMissingDirectories = config.allowMissingDirectories ?? false;
    this.allowFileTemplates = config.allowFileTemplates ?? false;
    this.reviveDates = config.reviveDates ?? false;
    this.useDataFiles = config.useDataFiles ?? false;
    this.catalogPort = new Catalog(this.catalog);
    this.writer = new Writer(this.outDir);
    this.payloads = new PayloadSource({
      catalog: this.catalog,
      samplePayloads: this.samplePayloads,
      dataDir: this.dataDir,
      useDataFiles: this.useDataFiles,
      loadPayload: config.loadPayload,
    });
  }

  find(templateId: string): TemplateCatalogEntry | undefined {
    return this.catalogPort.find(templateId);
  }

  slug(templateId: string): string {
    return this.catalogPort.slug(templateId);
  }

  ids(): string[] {
    return this.catalog.flatMap((entry) => entry.ids);
  }

  loadPayload(templateId: string, dataPath?: string): Promise<unknown> {
    return this.payloads.load(templateId, dataPath);
  }

  async render(templateId: string, options: RenderOptions = {}): Promise<string> {
    const payload = options.payload ?? (await this.loadPayload(templateId, options.dataPath));
    return renderEntry({
      templateId,
      payload,
      catalog: this.catalog,
      templatesDir: this.templatesDir,
      root: this.root,
      reviveDates: options.reviveDates ?? this.reviveDates,
      fileRenderer: this.allowFileTemplates ? renderFromFile : undefined,
    });
  }

  writeHtml(outPath: string, html: string, templateId?: string): Promise<string> {
    return this.writer.writeFile(outPath, html, templateId);
  }

  async write(templateId: string, options: WriteOptions = {}): Promise<string> {
    const html = await this.render(templateId, options);
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
    const html = await this.render(request.templateId, {
      payload: request.payload,
      dataPath: request.dataPath,
      reviveDates: request.reviveDates,
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
        reviveDates: request.reviveDates,
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
