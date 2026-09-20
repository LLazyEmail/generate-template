export type GenerateTemplateOptions = {
  title: string;
  body?: string;
};

export function generateTemplate(options: GenerateTemplateOptions): string {
  const title = options.title.trim();
  if (!title) {
    throw new Error('title is required');
  }

  const body = options.body?.trim() ?? '';

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    `  <title>${escapeHtml(title)}</title>`,
    '</head>',
    '<body>',
    `  <h1>${escapeHtml(title)}</h1>`,
    body ? `  ${body}` : '',
    '</body>',
    '</html>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
