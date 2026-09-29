import { describe, expect, it } from 'vitest';
import { createGenerator } from './generator';
import { GenerateTemplateError } from './errors';

/**
 * Documents the break for sibling LLazyEmail repos that still pass
 * `{ ids, file, exportName }` without an injected render function.
 */
describe('migration for other repositories', () => {
  it('old file-only catalog no longer renders by default', () => {
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], file: 'welcomeEmail.ts', exportName: 'WelcomeEmail' }],
      samplePayloads: { welcome: { name: 'Alex' } },
    });

    expect(() => gen.render('welcome')).toThrow(GenerateTemplateError);
    expect(() => gen.render('welcome')).toThrow(/allowFileTemplates/);
  });

  it('fix A: inject the template function (preferred)', () => {
    const WelcomeEmail = (p: unknown) => `<p>${(p as { name: string }).name}</p>`;
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: WelcomeEmail }],
      samplePayloads: { welcome: { name: 'Alex' } },
    });
    expect(gen.render('welcome')).toBe('<p>Alex</p>');
  });

  it('fix B: keep files, opt into the adapter', () => {
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], file: 'welcomeEmail.ts', exportName: 'WelcomeEmail' }],
      allowFileTemplates: true,
    });
    expect(gen.allowFileTemplates).toBe(true);
  });
});
