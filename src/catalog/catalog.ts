import { availableIds, findEntry, slugFromId } from './resolve';
import type { TemplateCatalogEntry } from '../types';

export class Catalog {
  constructor(readonly entries: TemplateCatalogEntry[]) {}

  find(templateId: string): TemplateCatalogEntry | undefined {
    return findEntry(this.entries, templateId);
  }

  slug(templateId: string): string {
    return slugFromId(this.entries, templateId);
  }

  ids(): string[] {
    return availableIds(this.entries);
  }
}
