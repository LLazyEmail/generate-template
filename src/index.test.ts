import { describe, expect, it } from 'vitest';
import * as api from './index';

describe('public package surface', () => {
  it('exports the engine contract only', () => {
    expect(typeof api.createGenerator).toBe('function');
    expect(typeof api.GenerateTemplateError).toBe('function');
    expect(typeof api.isGenerateTemplateError).toBe('function');
    expect(typeof api.writeGeneratedFile).toBe('function');
    expect(typeof api.writeGeneratedEmail).toBe('function');
    expect(typeof api.generateFileName).toBe('function');
  });

  it('does not export internals', () => {
    const exported = Object.keys(api);
    expect(exported).not.toContain('parseArgs');
    expect(exported).not.toContain('main');
    expect(exported).not.toContain('generateTemplate');
    expect(exported).not.toContain('findEntry');
    expect(exported).not.toContain('loadPayload');
    expect(exported).not.toContain('renderEntry');
    expect(exported).not.toContain('Catalog');
    expect(exported).not.toContain('Writer');
  });
});
