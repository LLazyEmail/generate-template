import type { TemplateCatalogEntry } from './types';

export function findEntry(
  catalog: TemplateCatalogEntry[],
  templateId: string
): TemplateCatalogEntry | undefined {
  if (!Array.isArray(catalog)) {
    throw new Error('catalog must be an array');
  }
  const needle = String(templateId).toLowerCase();
  return catalog.find((entry) => entry.ids.some((id) => id.toLowerCase() === needle));
}

export function slugFromId(catalog: TemplateCatalogEntry[], templateId: string): string {
  const entry = findEntry(catalog, templateId);
  return (entry ? entry.ids[0] : String(templateId))
    .replace(/Email$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

export function availableIds(catalog: TemplateCatalogEntry[]): string[] {
  return catalog.flatMap((entry) => entry.ids);
}
