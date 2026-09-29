import { describe, expect, it } from 'vitest';
import { createGenerator } from './generator';
import { GenerateTemplateError } from './errors';
import type { GenerateRequest, GenerateResult } from './types';

async function handleGenerate(
  engine: ReturnType<typeof createGenerator>,
  body: GenerateRequest
): Promise<{ status: number; body: GenerateResult | { code: string; message: string } }> {
  try {
    return { status: 200, body: await engine.run(body) };
  } catch (error) {
    if (error instanceof GenerateTemplateError) {
      return { status: 400, body: { code: error.code, message: error.message } };
    }
    throw error;
  }
}

describe('HTTP/API seam (no framework)', () => {
  const engine = createGenerator({
    catalog: [{ ids: ['welcome'], render: (p) => `<p>${(p as { name: string }).name}</p>` }],
  });

  it('returns html for a valid request object', async () => {
    const res = await handleGenerate(engine, { templateId: 'welcome', payload: { name: 'Alex' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ templateId: 'welcome', html: '<p>Alex</p>' });
  });

  it('maps GenerateTemplateError to 400 + code', async () => {
    const res = await handleGenerate(engine, { templateId: 'missing', payload: {} });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'UNKNOWN_TEMPLATE' });
  });
});
