import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TemplateCatalogEntry } from './types';
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

export function loadPayload(options: {
  templateId: string;
  dataPath?: string;
  catalog: TemplateCatalogEntry[];
  samplePayloads: Record<string, unknown>;
  dataDir: string;
  allowMissingDirectories?: boolean;
}): unknown {
  const { templateId, dataPath, catalog, samplePayloads, dataDir, allowMissingDirectories = false } = options;
  if (dataPath) return requireData(path.resolve(process.cwd(), dataPath));
  if (samplePayloads[templateId]) return samplePayloads[templateId];
  
  // Check if data directory exists before trying to load files
  if (!fs.existsSync(dataDir)) {
    if (allowMissingDirectories) {
      throw new Error(
        `No payload for "${templateId}". Pass dataPath or add sample payload. Data directory ${dataDir} does not exist.`
      );
    }
    throw new Error(
      `Data directory does not exist: ${dataDir}. Pass dataPath or create the directory with sample data files.`
    );
  }
  
  const slugs = [templateId, slugFromId(catalog, templateId)];
  for (const slug of slugs) {
    const candidate = path.join(dataDir, `${slug}.data.js`);
    if (fs.existsSync(candidate)) return requireData(candidate);
  }
  throw new Error(
    `No payload for "${templateId}". Pass dataPath or add ${path.join(dataDir, `${slugFromId(catalog, templateId)}.data.js`)}`
  );
}
