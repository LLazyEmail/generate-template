import { describe, expect, it } from 'vitest';
import { Catalog } from './catalog';
import { GenerateTemplateError } from '../engine/errors';

describe('Catalog port', () => {
  const catalog = new Catalog([
    { ids: ['welcome', 'WelcomeEmail'], render: () => 'w' },
    { ids: ['password-reset', 'PasswordResetEmail'], file: 'password-reset.ts', exportName: 'reset' },
  ]);

  it('finds aliases case-insensitively', () => {
    expect(catalog.find('WELCOME')?.ids[0]).toBe('welcome');
    expect(catalog.find('PasswordResetEmail')?.file).toBe('password-reset.ts');
  });

  it('returns undefined for unknown ids', () => {
    expect(catalog.find('nope')).toBeUndefined();
  });

  it('builds slugs from primary ids', () => {
    expect(catalog.slug('WelcomeEmail')).toBe('welcome');
    expect(catalog.slug('password-reset')).toBe('password-reset');
    expect(catalog.slug('UnknownThing')).toBe('unknown-thing');
  });

  it('lists every alias', () => {
    expect(catalog.ids()).toEqual([
      'welcome',
      'WelcomeEmail',
      'password-reset',
      'PasswordResetEmail',
    ]);
  });

  it('rejects a non-array catalog', () => {
    expect(() => new Catalog(null as never).find('x')).toThrow(GenerateTemplateError);
  });
});
