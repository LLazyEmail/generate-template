import { GenerateTemplateError } from './errors';
import type { RenderContext, TemplateRenderer } from './types';

export async function invokeRenderer(
  renderer: TemplateRenderer,
  payload: unknown,
  templateId?: string
): Promise<string> {
  const html = await (typeof renderer === 'function' ? renderer(payload) : renderer.render(payload));
  if (typeof html !== 'string') {
    throw new GenerateTemplateError('RENDER_FAILED', 'Template renderer must return a string', templateId);
  }
  return html;
}

export async function renderInProcess(ctx: RenderContext): Promise<string> {
  if (!ctx.entry.render) {
    throw new GenerateTemplateError(
      'RENDER_FAILED',
      `Template "${ctx.templateId}" has no in-process render function`,
      ctx.templateId
    );
  }
  return invokeRenderer(ctx.entry.render, ctx.payload, ctx.templateId);
}
