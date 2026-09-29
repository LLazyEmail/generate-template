import { GenerateTemplateError } from './errors';
import type { PayloadLoader, TemplateCatalogEntry } from './types';
import { slugFromId } from './resolve';
import { loadPayloadFromFiles } from './adapters/payload-files';

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
      useDataFiles: boolean;
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
      useDataFiles: this.options.useDataFiles,
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
}): Promise<unknown> {
  const {
    templateId,
    dataPath,
    catalog,
    samplePayloads,
    dataDir,
    useDataFiles = false,
  } = options;

  if (dataPath) {
    return loadPayloadFromFiles({ templateId, dataPath, catalog, dataDir });
  }
  if (samplePayloads[templateId]) return samplePayloads[templateId];

  if (useDataFiles) {
    return loadPayloadFromFiles({ templateId, catalog, dataDir });
  }

  throw new GenerateTemplateError(
    'NO_PAYLOAD',
    `No payload for "${templateId}". Pass payload, dataPath, samplePayloads, a loadPayload hook, or set useDataFiles.` +
      (dataDir ? ` (${slugFromId(catalog, templateId)}.data.js)` : ''),
    templateId
  );
}
