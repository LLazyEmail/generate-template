import path from 'node:path';
import { loadData, pathExists } from 'markup-generator';
import { GenerateTemplateError } from '../errors';
import type { TemplateCatalogEntry } from '../types';
import { slugFromId } from '../resolve';

export async function loadPayloadFromFiles(options: {
  templateId: string;
  dataPath?: string;
  catalog: TemplateCatalogEntry[];
  dataDir: string;
}): Promise<unknown> {
  const { templateId, dataPath, catalog, dataDir } = options;

  if (dataPath) {
    try {
      return await loadData(path.resolve(process.cwd(), dataPath));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GenerateTemplateError('NO_PAYLOAD', message, templateId);
    }
  }

  const slugs = [templateId, slugFromId(catalog, templateId)];
  for (const slug of slugs) {
    const candidate = path.join(dataDir, `${slug}.data.js`);
    if (pathExists(candidate)) {
      return loadData(candidate);
    }
  }

  throw new GenerateTemplateError(
    'NO_PAYLOAD',
    `No payload for "${templateId}". Pass payload, dataPath, or enable useDataFiles with ${path.join(dataDir, `${slugFromId(catalog, templateId)}.data.js`)}`,
    templateId
  );
}
