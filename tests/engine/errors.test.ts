import { describe, expect, it } from 'vitest';
import { createGenerator } from '../../src/create-generator';
import { GenerateTemplateError, isGenerateTemplateError } from '../../src/engine/errors';

describe('GenerateTemplateError', () => {
  it('tags unknown template ids', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['only'], render: () => 'x' }],
    });

    try {
      await gen.render('welcome', { payload: {} });
      throw new Error('expected throw');
    } catch (error) {
      expect(isGenerateTemplateError(error)).toBe(true);
      expect((error as GenerateTemplateError).code).toBe('UNKNOWN_TEMPLATE');
      expect((error as GenerateTemplateError).templateId).toBe('welcome');
    }
  });

  it('tags missing payloads', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['only'], render: () => 'x' }],
    });

    try {
      await gen.loadPayload('only');
      throw new Error('expected throw');
    } catch (error) {
      expect(isGenerateTemplateError(error)).toBe(true);
      expect((error as GenerateTemplateError).code).toBe('NO_PAYLOAD');
    }
  });

  it('run() returns html without writing', async () => {
    const gen = createGenerator({
      catalog: [{ ids: ['ping'], render: (p) => `<p>${(p as { n: string }).n}</p>` }],
    });

    const result = await gen.run({ templateId: 'ping', payload: { n: 'ok' } });
    expect(result).toEqual({ templateId: 'ping', html: '<p>ok</p>' });
  });
});
