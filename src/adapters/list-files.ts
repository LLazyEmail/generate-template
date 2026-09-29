import { listTemplateFiles as listFromWriteModule } from 'markup-generator';

export type ListTemplateFilesFn = (
  dir: string,
  options?: { skipFiles?: Iterable<string> }
) => string[];

/** CLI / opt-in directory scan. Engine should list catalog ids, not folders. */
export const listTemplateFiles: ListTemplateFilesFn = (dir, options) =>
  listFromWriteModule(dir, options);
