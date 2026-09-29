import { GenerateTemplateError } from '../errors';
import type { RenderContext, TemplateRenderer } from '../types';

export function invokeRenderer(renderer: TemplateRenderer, payload: unknown, templateId?: string): string {
  const html = typeof renderer === 'function' ? renderer(payload) : renderer.render(payload);
  if (typeof html !== 'string') {
    throw new GenerateTemplateError('RENDER_FAILED', 'Template renderer must return a string', templateId);
  }
  return html;
}

export function renderInProcess(ctx: RenderContext): string {
  if (!ctx.entry.render) {
    throw new GenerateTemplateError(
      'RENDER_FAILED',
      `Template "${ctx.templateId}" has no in-process render function`,
      ctx.templateId
    );
  }
  return invokeRenderer(ctx.entry.render, ctx.payload, ctx.templateId);
}
