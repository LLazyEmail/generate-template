export type GenerateTemplateErrorCode =
  | 'UNKNOWN_TEMPLATE'
  | 'NO_PAYLOAD'
  | 'RENDER_FAILED'
  | 'WRITE_FAILED'
  | 'INVALID_CONFIG';

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
