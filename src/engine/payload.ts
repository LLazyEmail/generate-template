import { slugFromId } from '../catalog';
import { GenerateTemplateError } from './errors';
import type { PayloadFromFiles, PayloadLoader, TemplateCatalogEntry } from './types';

/**
 * `Date#toJSON` runs before a replacer sees the value, so the raw value is read from `this`.
 */
export function serializePayload(payload: unknown): string {
  return JSON.stringify(payload, function (this: Record<string, unknown>, key, value) {
    const raw = this[key];
    return raw instanceof Date ? { __date: raw.toISOString() } : value;
  });
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
      useDataFiles: boolean;
      loadPayload?: PayloadLoader;
      loadFromFiles?: PayloadFromFiles;
    },
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
      useDataFiles: this.options.useDataFiles,
      loadFromFiles: this.options.loadFromFiles,
    });
  }
}

export async function loadPayload(options: {
  templateId: string;
  dataPath?: string;
  catalog: TemplateCatalogEntry[];
  samplePayloads: Record<string, unknown>;
  dataDir: string;
  useDataFiles?: boolean;
  loadFromFiles?: PayloadFromFiles;
}): Promise<unknown> {
  const {
    templateId,
    dataPath,
    catalog,
    samplePayloads,
    dataDir,
    useDataFiles = false,
    loadFromFiles,
  } = options;

  if (dataPath) {
    if (!loadFromFiles) {
      throw new GenerateTemplateError(
        'NO_PAYLOAD',
        `No payload for "${templateId}". dataPath needs a loadFromFiles adapter.`,
        templateId,
      );
    }
    return loadFromFiles({ templateId, dataPath, catalog, dataDir });
  }
  if (samplePayloads[templateId]) return samplePayloads[templateId];

  if (useDataFiles) {
    if (!loadFromFiles) {
      throw new GenerateTemplateError(
        'NO_PAYLOAD',
        `No payload for "${templateId}". useDataFiles needs a loadFromFiles adapter.`,
        templateId,
      );
    }
    return loadFromFiles({ templateId, catalog, dataDir });
  }

  throw new GenerateTemplateError(
    'NO_PAYLOAD',
    `No payload for "${templateId}". Pass payload, dataPath, samplePayloads, a loadPayload hook, or set useDataFiles.` +
      (dataDir ? ` (${slugFromId(catalog, templateId)}.data.js)` : ''),
    templateId,
  );
}
