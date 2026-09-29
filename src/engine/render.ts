import { availableIds, findEntry } from '../catalog';
import { GenerateTemplateError } from './errors';
import { renderInProcess } from './in-process';
import { reviveDates } from './payload';
import type { FileRenderer, RenderContext, TemplateCatalogEntry } from './types';

export { invokeRenderer } from './in-process';
export type { FileRenderer };

export async function renderEntry(options: {
  templateId: string;
  payload: unknown;
  catalog: TemplateCatalogEntry[];
  templatesDir: string;
  root: string;
  reviveDates?: boolean;
  fileRenderer?: FileRenderer;
}): Promise<string> {
  const {
    templateId,
    payload,
    catalog,
    templatesDir,
    root,
    reviveDates: shouldRevive = false,
    fileRenderer,
  } = options;
  const entry = findEntry(catalog, templateId);
  if (!entry) {
    throw new GenerateTemplateError(
      'UNKNOWN_TEMPLATE',
      `Unknown template id: "${templateId}". Available: ${availableIds(catalog).join(', ')}`,
      templateId
    );
  }

  const ctx: RenderContext = {
    templateId,
    payload: shouldRevive ? reviveDates(payload) : payload,
    entry,
    templatesDir,
    root,
  };

  if (entry.render) {
    return renderInProcess(ctx);
  }

  if (entry.file) {
    if (!fileRenderer) {
      throw new GenerateTemplateError(
        'RENDER_FAILED',
        `Template "${templateId}" uses a file adapter. Pass allowFileTemplates: true or inject a render function.`,
        templateId
      );
    }
    return fileRenderer(ctx);
  }

  throw new GenerateTemplateError(
    'RENDER_FAILED',
    `Template "${templateId}" has no render function or file`,
    templateId
  );
}
