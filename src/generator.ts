import fs from 'node:fs';
import path from 'node:path';
import { generateFileName, MarkupGeneratorError, writeGeneratedEmail, writeGeneratedFile } from 'markup-generator';
import { GenerateTemplateError } from './errors';
import { findEntry, slugFromId } from './resolve';
import { loadPayload } from './payload';
import { renderEntry } from './render';
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
    });
  }

  async writeHtml(outPath: string, html: string, templateId?: string): Promise<string> {
    try {
      const resolvedOutPath = path.resolve(process.cwd(), outPath);
      return await writeGeneratedFile({
        content: html,
        fileName: path.basename(resolvedOutPath),
        dir: path.dirname(resolvedOutPath),
      });
    } catch (error) {
      throw wrapWriteError(error, templateId);
    }
  }

  async write(templateId: string, options: WriteOptions = {}): Promise<string> {
    const html = this.render(templateId, options);
    const stableName = `${this.slug(templateId)}.html`;
    const fileName = options.uniqueName ? generateFileName(this.slug(templateId), 'html') : stableName;

    try {
      if (options.out) {
        const resolved = path.resolve(process.cwd(), options.out);
        const looksLikeFile = path.extname(resolved) !== '';
        const dir = looksLikeFile ? path.dirname(resolved) : resolved;
        const name = looksLikeFile ? path.basename(resolved) : fileName;
        return await writeGeneratedFile({
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
        throw new GenerateTemplateError('WRITE_FAILED', `Failed to write ${fileName}`, templateId);
      }
      return written;
    } catch (error) {
      throw wrapWriteError(error, templateId);
    }
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

function wrapWriteError(error: unknown, templateId?: string): GenerateTemplateError {
  if (error instanceof GenerateTemplateError) return error;
  if (error instanceof MarkupGeneratorError) {
    return new GenerateTemplateError('WRITE_FAILED', `${error.code}: ${error.message}`, templateId);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new GenerateTemplateError('WRITE_FAILED', message, templateId);
}
