export type TemplateRenderer =
  | ((payload: unknown) => string | Promise<string>)
  | { render: (payload: unknown) => string | Promise<string> };

export type PayloadLoader = (templateId: string, dataPath?: string) => unknown | Promise<unknown>;

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
  allowFileTemplates?: boolean;
  /** Opt into scanning dataDir for {slug}.data.js. Default false. */
  useDataFiles?: boolean;
  loadPayload?: PayloadLoader;
  reviveDates?: boolean;
}

export interface RenderOptions {
  payload?: unknown;
  dataPath?: string;
  reviveDates?: boolean;
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
  reviveDates?: boolean;
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
