import path from 'node:path';
import { generateFileName, MarkupGeneratorError, writeGeneratedEmail, writeGeneratedFile } from 'markup-generator';
import { GenerateTemplateError } from '../engine/errors';

export class Writer {
  constructor(readonly outDir: string) {}

  async writeFile(outPath: string, html: string, templateId?: string): Promise<string> {
    try {
      const resolvedOutPath = path.resolve(process.cwd(), outPath);
      return await writeGeneratedFile({
        content: html,
        fileName: path.basename(resolvedOutPath),
        dir: path.dirname(resolvedOutPath),
      });
    } catch (error) {
      throw wrapWriteError(error, templateId);
    }
  }

  async writeNamed(options: {
    templateId: string;
    html: string;
    slug: string;
    out?: string;
    uniqueName?: boolean;
  }): Promise<string> {
    const { templateId, html, slug, out, uniqueName } = options;
    const stableName = `${slug}.html`;
    const fileName = uniqueName ? generateFileName(slug, 'html') : stableName;

    try {
      if (out) {
        const resolved = path.resolve(process.cwd(), out);
        const looksLikeFile = path.extname(resolved) !== '';
        const dir = looksLikeFile ? path.dirname(resolved) : resolved;
        const name = looksLikeFile ? path.basename(resolved) : fileName;
        return await writeGeneratedFile({
          content: html,
          fileName: name,
          dir,
        });
      }

      const written = await writeGeneratedEmail({
        content: html,
        fileName,
        label: templateId,
        dir: this.outDir,
      });
      if (!written) {
        throw new GenerateTemplateError('WRITE_FAILED', `Failed to write ${fileName}`, templateId);
      }
      return written;
    } catch (error) {
      throw wrapWriteError(error, templateId);
    }
  }
}

export function wrapWriteError(error: unknown, templateId?: string): GenerateTemplateError {
  if (error instanceof GenerateTemplateError) return error;
  if (error instanceof MarkupGeneratorError) {
    return new GenerateTemplateError('WRITE_FAILED', `${error.code}: ${error.message}`, templateId);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new GenerateTemplateError('WRITE_FAILED', message, templateId);
}
