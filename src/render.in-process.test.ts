import { describe, expect, it } from 'vitest';
import { GenerateTemplateError } from './errors';
import { invokeRenderer, renderEntry } from './render';

describe('in-process renderer', () => {
  it('invokes a function renderer', () => {
    expect(invokeRenderer((p) => `hi-${(p as { n: string }).n}`, { n: 'a' })).toBe('hi-a');
  });

  it('invokes an object with render()', () => {
    expect(invokeRenderer({ render: () => '<ok/>' }, {})).toBe('<ok/>');
  });

  it('rejects a non-string return', () => {
    expect(() => invokeRenderer(() => 1 as never, {})).toThrow(GenerateTemplateError);
  });

  it('renderEntry prefers inject render over file', () => {
    const html = renderEntry({
      templateId: 'welcome',
      payload: { name: 'Sam' },
      catalog: [
        {
          ids: ['welcome'],
          file: 'ignored.ts',
          render: (p) => `<h1>${(p as { name: string }).name}</h1>`,
        },
      ],
      templatesDir: '/nope',
      root: '/nope',
      allowFileTemplates: false,
    });
    expect(html).toBe('<h1>Sam</h1>');
  });
});
