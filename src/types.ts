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
}

export interface RenderOptions {
  payload?: unknown;
  dataPath?: string;
}

export interface WriteOptions extends RenderOptions {
  out?: string;
}

export interface CliArgs {
  all?: boolean;
  list?: boolean;
  template?: string;
  data?: string;
  out?: string;
}
