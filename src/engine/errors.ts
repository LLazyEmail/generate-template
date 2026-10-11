export type GenerateTemplateErrorCode =
  | 'UNKNOWN_TEMPLATE'
  | 'NO_PAYLOAD'
  | 'RENDER_FAILED'
  | 'WRITE_FAILED'
  | 'INVALID_CONFIG'
  | 'CONFIG_NOT_FOUND'
  | 'CONFIG_IMPORT_FAILED'
  | 'CONFIG_INVALID';

export class GenerateTemplateError extends Error {
  readonly code: GenerateTemplateErrorCode;
  readonly templateId?: string;

  constructor(code: GenerateTemplateErrorCode, message: string, templateId?: string) {
    super(message);
    this.name = 'GenerateTemplateError';
    this.code = code;
    this.templateId = templateId;
  }
}

export function isGenerateTemplateError(error: unknown): error is GenerateTemplateError {
  return error instanceof GenerateTemplateError;
}

/** Message of anything that was thrown. Internal; not part of the public API. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
