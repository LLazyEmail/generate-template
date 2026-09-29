import { describe, expect, it } from 'vitest';
import { GenerateTemplateError } from './errors';
import { invokeRenderer, renderEntry } from './render';

describe('in-process renderer', () => {
  it('invokes a function renderer', async () => {
    expect(await invokeRenderer((p) => `hi-${(p as { n: string }).n}`, { n: 'a' })).toBe('hi-a');
  });

  it('invokes an object with render()', async () => {
    expect(await invokeRenderer({ render: () => '<ok/>' }, {})).toBe('<ok/>');
  });

  it('invokes an async renderer', async () => {
    expect(await invokeRenderer(async () => '<async/>', {})).toBe('<async/>');
  });

  it('rejects a non-string return', async () => {
    await expect(invokeRenderer(() => 1 as never, {})).rejects.toThrow(GenerateTemplateError);
  });

  it('renderEntry prefers inject render over file', async () => {
    const html = await renderEntry({
      templateId: 'welcome',
      payload: { name: 'Sam' },
      catalog: [
        {
          ids: ['welcome'],
          file: 'ignored.ts',
          render: (p) => `<h1>${(p as { name: string }).name}</h1>`,
        },
      ],
      templatesDir: '',
      root: '',
    });
    expect(html).toBe('<h1>Sam</h1>');
  });
});
