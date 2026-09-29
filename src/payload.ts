import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson } from 'markup-generator';
import { GenerateTemplateError } from './errors';
import type { PayloadLoader, TemplateCatalogEntry } from './types';
import { slugFromId } from './resolve';

const requireData = createRequire(fileURLToPath(import.meta.url));

export function serializePayload(payload: unknown): string {
  return JSON.stringify(replaceDates(payload));
}

function replaceDates(value: unknown): unknown {
  if (value instanceof Date) return { __date: value.toISOString() };
  if (Array.isArray(value)) return value.map(replaceDates);
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, current] of Object.entries(value as Record<string, unknown>)) {
      next[key] = replaceDates(current);
    }
    return next;
  }
  return value;
}

export function reviveDates(value: unknown): unknown {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === 'object' &&
    '__date' in value &&
    typeof (value as { __date?: unknown }).__date === 'string'
  ) {
    return new Date((value as { __date: string }).__date);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>).forEach((key) => {
      const current = (value as Record<string, unknown>)[key];
      next[key] = reviveDates(current);
    });
    return next;
  }
  return value;
}

export class PayloadSource {
  constructor(
    private readonly options: {
      catalog: TemplateCatalogEntry[];
      samplePayloads: Record<string, unknown>;
      dataDir: string;
      allowMissingDirectories: boolean;
      loadPayload?: PayloadLoader;
    }
  ) {}

  async load(templateId: string, dataPath?: string): Promise<unknown> {
    if (this.options.loadPayload) {
      return this.options.loadPayload(templateId, dataPath);
    }
    return loadPayload({
      templateId,
      dataPath,
      catalog: this.options.catalog,
      samplePayloads: this.options.samplePayloads,
      dataDir: this.options.dataDir,
      allowMissingDirectories: this.options.allowMissingDirectories,
    });
  }
}

export async function loadPayload(options: {
  templateId: string;
  dataPath?: string;
  catalog: TemplateCatalogEntry[];
  samplePayloads: Record<string, unknown>;
  dataDir: string;
  allowMissingDirectories?: boolean;
}): Promise<unknown> {
  const { templateId, dataPath, catalog, samplePayloads, dataDir, allowMissingDirectories = false } = options;

  if (dataPath) {
    return loadDataFile(path.resolve(process.cwd(), dataPath), templateId);
  }
  if (samplePayloads[templateId]) return samplePayloads[templateId];

  if (!fs.existsSync(dataDir)) {
    throw new GenerateTemplateError(
      'NO_PAYLOAD',
      allowMissingDirectories
        ? `No payload for "${templateId}". Pass dataPath, payload, samplePayloads, or a loadPayload hook.`
        : `Data directory does not exist: ${dataDir}. Pass payload, dataPath, or create the directory.`,
      templateId
    );
  }

  const slugs = [templateId, slugFromId(catalog, templateId)];
  for (const slug of slugs) {
    const candidate = path.join(dataDir, `${slug}.data.js`);
    if (fs.existsSync(candidate)) return requireData(candidate);
  }
  throw new GenerateTemplateError(
    'NO_PAYLOAD',
    `No payload for "${templateId}". Pass payload, dataPath, or add ${path.join(dataDir, `${slugFromId(catalog, templateId)}.data.js`)}`,
    templateId
  );
}

async function loadDataFile(absolutePath: string, templateId: string): Promise<unknown> {
  const ext = path.extname(absolutePath).toLowerCase();
  if (ext === '.json') {
    try {
      return await readJson(absolutePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GenerateTemplateError('NO_PAYLOAD', message, templateId);
    }
  }
  return requireData(absolutePath);
}
