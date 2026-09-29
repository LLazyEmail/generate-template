export type TemplateRenderer =
  | ((payload: unknown) => string)
  | { render: (payload: unknown) => string };

export interface TemplateCatalogEntry {
  ids: string[];
  file?: string;
  exportName?: string;
  render?: TemplateRenderer;
  description?: string;
}

export interface GeneratorConfig {
  catalog?: TemplateCatalogEntry[];
  samplePayloads?: Record<string, unknown>;
  root?: string;
  templatesDir?: string;
  dataDir?: string;
  outDir?: string;
  skipFiles?: string[];
  allowMissingDirectories?: boolean;
  /**
   * When true, catalog `file` entries are loaded via a child Node process.
   * Default false. Other repos that still use `file` + `exportName` must set this.
   */
  allowFileTemplates?: boolean;
}

export interface RenderOptions {
  payload?: unknown;
  dataPath?: string;
}

export interface WriteOptions extends RenderOptions {
  out?: string;
  uniqueName?: boolean;
}

export interface GenerateWriteOptions {
  out?: string;
  uniqueName?: boolean;
}

export interface GenerateRequest {
  templateId: string;
  payload?: unknown;
  dataPath?: string;
  write?: boolean | GenerateWriteOptions;
}

export interface GenerateResult {
  templateId: string;
  html: string;
  path?: string;
}

export interface CliArgs {
  all?: boolean;
  list?: boolean;
  template?: string;
  data?: string;
  out?: string;
}

export interface RenderContext {
  templateId: string;
  payload: unknown;
  entry: TemplateCatalogEntry;
  templatesDir: string;
  root: string;
}
