import { describe, expect, it } from 'vitest';
import { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';
import type { TemplateCatalogEntry } from './types';

describe('template catalog', () => {
  it('has unique primary ids and files', () => {
    const primaryIds = CATALOG.map((entry) => entry.ids[0]);
    const files = CATALOG.map((entry) => entry.file).filter(Boolean);

    expect(new Set(primaryIds).size).toBe(primaryIds.length);
    expect(new Set(files).size).toBe(files.length);
  });

  it('exposes a sample payload for every alias', () => {
    for (const entry of CATALOG) {
      expect(entry.ids.length).toBeGreaterThan(0);
      if (entry.file) {
        expect(entry.exportName).toBeDefined();
        expect(typeof entry.exportName).toBe('string');
      }
      for (const id of entry.ids) {
        expect(SAMPLE_PAYLOADS[id], `missing payload for ${id}`).toBeTruthy();
      }
    }
  });

  it('keeps welcome signupDate as a Date', () => {
    const payload = SAMPLE_PAYLOADS.WelcomeEmail as { signupDate: Date };
    expect(payload.signupDate).toBeInstanceOf(Date);
  });

  it('validates catalog entry structure', () => {
    for (const entry of CATALOG) {
      expect(entry.ids).toBeInstanceOf(Array);
      expect(entry.ids.length).toBeGreaterThan(0);
      // Either file+exportName or render should be present
      const hasFile = Boolean(entry.file && entry.exportName);
      const hasRender = Boolean(entry.render);
      expect(hasFile || hasRender).toBe(true);
    }
  });
});
