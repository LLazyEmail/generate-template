import { describe, expect, it } from 'vitest';
import { CATALOG, SAMPLE_PAYLOADS } from './template-catalog';

describe('template catalog', () => {
  it('has unique primary ids and files', () => {
    const primaryIds = CATALOG.map((entry) => entry.ids[0]);
    const files = CATALOG.map((entry) => entry.file);

    expect(new Set(primaryIds).size).toBe(primaryIds.length);
    expect(new Set(files).size).toBe(files.length);
  });

  it('exposes a sample payload for every alias', () => {
    for (const entry of CATALOG) {
      expect(entry.ids.length).toBeGreaterThan(0);
      expect(entry.exportName).toBeTruthy();
      for (const id of entry.ids) {
        expect(SAMPLE_PAYLOADS[id], `missing payload for ${id}`).toBeTruthy();
      }
    }
  });

  it('keeps welcome signupDate as a Date', () => {
    const payload = SAMPLE_PAYLOADS.WelcomeEmail as { signupDate: Date };
    expect(payload.signupDate).toBeInstanceOf(Date);
  });
});
