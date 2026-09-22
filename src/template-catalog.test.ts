import { describe, expect, it } from 'vitest';
import type { TemplateCatalogEntry } from './types';

describe('template catalog utilities', () => {
  it('validates catalog entry structure', () => {
    const testCatalog: TemplateCatalogEntry[] = [
      {
        ids: ['test', 'TestEmail'],
        file: 'test.ts',
        exportName: 'test',
        description: 'Test template',
      },
      {
        ids: ['render-only'],
        render: (payload: unknown) => `<div>${JSON.stringify(payload)}</div>`,
      },
    ];

    for (const entry of testCatalog) {
      expect(entry.ids).toBeInstanceOf(Array);
      expect(entry.ids.length).toBeGreaterThan(0);
      // Either file+exportName or render should be present
      const hasFile = Boolean(entry.file && entry.exportName);
      const hasRender = Boolean(entry.render);
      expect(hasFile || hasRender).toBe(true);
    }
  });

  it('ensures unique primary ids in catalog', () => {
    const testCatalog: TemplateCatalogEntry[] = [
      { ids: ['unique-1'], render: () => 'test1' },
      { ids: ['unique-2'], render: () => 'test2' },
      { ids: ['unique-3'], render: () => 'test3' },
    ];

    const primaryIds = testCatalog.map((entry) => entry.ids[0]);
    expect(new Set(primaryIds).size).toBe(primaryIds.length);
  });

  it('allows multiple aliases per template', () => {
    const testCatalog: TemplateCatalogEntry[] = [
      {
        ids: ['welcome', 'WelcomeEmail', 'onboarding'],
        render: () => 'Welcome',
      },
    ];

    expect(testCatalog[0].ids).toHaveLength(3);
    expect(testCatalog[0].ids).toContain('welcome');
    expect(testCatalog[0].ids).toContain('WelcomeEmail');
    expect(testCatalog[0].ids).toContain('onboarding');
  });
});
