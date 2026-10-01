import { describe, expect, it } from 'vitest';
import { createGenerator } from '../../src/create-generator';
import { GenerateTemplateError } from '../../src/engine/errors';

describe('migration for other repositories', () => {
  it('old file-only catalog no longer renders by default', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], file: 'welcomeEmail.ts', exportName: 'WelcomeEmail' }],
      samplePayloads: { welcome: { name: 'Alex' } },
    });

    await expect(gen.render('welcome')).rejects.toThrow(GenerateTemplateError);
    await expect(gen.render('welcome')).rejects.toThrow(/allowFileTemplates/);
  });

  it('fix A: inject the template function (preferred)', async () => {
    const WelcomeEmail = (p: unknown) => `<p>${(p as { name: string }).name}</p>`;
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], render: WelcomeEmail }],
      samplePayloads: { welcome: { name: 'Alex' } },
    });
    expect(await gen.render('welcome')).toBe('<p>Alex</p>');
  });

  it('fix B: keep files, opt into the adapter', () => {
    const gen = createGenerator({
      catalog: [{ ids: ['welcome'], file: 'welcomeEmail.ts', exportName: 'WelcomeEmail' }],
      allowFileTemplates: true,
    });
    expect(gen.allowFileTemplates).toBe(true);
  });
});
