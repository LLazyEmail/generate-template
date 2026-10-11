import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathExists } from 'markup-generator';
import { GenerateTemplateError, errorMessage } from '../engine/errors';
import { serializePayload } from '../engine/payload';
import type { RenderContext } from '../engine/types';

/** Opt-in spawn path. Engine must not import this unless allowFileTemplates. */
export function renderFromFile(ctx: RenderContext): string {
  if (!ctx.entry.file) {
    throw new GenerateTemplateError(
      'RENDER_FAILED',
      `Template "${ctx.templateId}" has no file`,
      ctx.templateId,
    );
  }

  const modulePath = path.join(ctx.templatesDir, ctx.entry.file);
  if (!pathExists(modulePath)) {
    throw new GenerateTemplateError(
      'RENDER_FAILED',
      `Template file missing: ${path.relative(ctx.root, modulePath)}`,
      ctx.templateId,
    );
  }

  try {
    return spawnTemplateModule(
      modulePath,
      ctx.entry.exportName ?? 'default',
      ctx.payload,
      ctx.root,
    );
  } catch (error) {
    if (error instanceof GenerateTemplateError) throw error;
    throw new GenerateTemplateError('RENDER_FAILED', errorMessage(error), ctx.templateId);
  }
}

function spawnTemplateModule(
  modulePath: string,
  exportName: string,
  payload: unknown,
  root: string,
): string {
  // The payload goes over stdin and the script over `-e`, so no temp files are written.
  const source = `
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
function revive(value) {
  if (value && typeof value === 'object' && typeof value.__date === 'string') return new Date(value.__date);
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, val] of Object.entries(value)) {
      next[key] = revive(val);
    }
    return next;
  }
  return value;
}
const raw = JSON.parse(readFileSync(0, 'utf8'));
const mod = await import(pathToFileURL(${JSON.stringify(modulePath)}).href);
const exported = mod[${JSON.stringify(exportName)}] ?? mod.default;
if (!exported) throw new Error('Export missing');
const html = typeof exported === 'function' ? exported(revive(raw)) : exported.render(revive(raw));
process.stdout.write(html);
`;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', source],
    {
      input: serializePayload(payload),
      encoding: 'utf8',
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim();
    throw new Error(err || `node exited ${result.status}`);
  }
  return result.stdout;
}
