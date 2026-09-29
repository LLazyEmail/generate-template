import { GenerateTemplateError } from './errors';
import { renderFromFile } from './render/file-adapter';
import { renderInProcess } from './render/in-process';
import { availableIds, findEntry } from './resolve';
import { reviveDates } from './payload';
import type { TemplateCatalogEntry } from './types';

export { invokeRenderer } from './render/in-process';
export { renderFromFile } from './render/file-adapter';

export function renderEntry(options: {
  templateId: string;
  payload: unknown;
  catalog: TemplateCatalogEntry[];
  templatesDir: string;
  root: string;
  allowFileTemplates?: boolean;
}): string {
  const { templateId, payload, catalog, templatesDir, root, allowFileTemplates = false } = options;
  const entry = findEntry(catalog, templateId);
  if (!entry) {
    throw new GenerateTemplateError(
      'UNKNOWN_TEMPLATE',
      `Unknown template id: "${templateId}". Available: ${availableIds(catalog).join(', ')}`,
      templateId
    );
  }

  const ctx = {
    templateId,
    payload: reviveDates(payload),
    entry,
    templatesDir,
    root,
  };

  if (entry.render) {
    return renderInProcess(ctx);
  }

  if (entry.file) {
    if (!allowFileTemplates) {
      throw new GenerateTemplateError(
        'RENDER_FAILED',
        `Template "${templateId}" uses a file adapter. Pass allowFileTemplates: true or inject a render function.`,
        templateId
      );
    }
    return renderFromFile(ctx);
  }

  throw new GenerateTemplateError(
    'RENDER_FAILED',
    `Template "${templateId}" has no render function or file`,
    templateId
  );
}
