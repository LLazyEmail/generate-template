import type { TemplateCatalogEntry } from '../src/engine/types.ts';

type Named = { name: string };

const welcome: TemplateCatalogEntry['render'] = (payload) => {
  const { name } = payload as Named;
  return `<!DOCTYPE html><html><body><h1>Welcome, ${name}</h1><p>Thanks for joining.</p></body></html>`;
};

const invoice: TemplateCatalogEntry['render'] = (payload) => {
  const data = payload as Named & { invoice_id: string; total: string };
  return `<!DOCTYPE html><html><body><h1>Invoice ${data.invoice_id}</h1><p>${data.name}</p><p>${data.total}</p></body></html>`;
};

const notice: TemplateCatalogEntry['render'] = (payload) => {
  const { name } = payload as Named & { message: string };
  return `<!DOCTYPE html><html><body><h1>Notice</h1><p>${name}: ${(payload as { message: string }).message}</p></body></html>`;
};

export const EXAMPLE_CATALOG: TemplateCatalogEntry[] = [
  {
    ids: ['welcome', 'WelcomeEmail'],
    render: welcome,
    description: 'Package-owned welcome fixture',
  },
  {
    ids: ['invoice', 'InvoiceEmail'],
    render: invoice,
    description: 'Package-owned invoice fixture',
  },
  { ids: ['notice', 'NoticeEmail'], render: notice, description: 'Package-owned notice fixture' },
];

export const EXAMPLE_SAMPLE_PAYLOADS: Record<string, unknown> = {
  welcome: { name: 'Alex' },
  invoice: { name: 'Alex', invoice_id: 'INV-1', total: '$10.00' },
  notice: { name: 'Alex', message: 'Your export is ready.' },
};

EXAMPLE_SAMPLE_PAYLOADS.WelcomeEmail = EXAMPLE_SAMPLE_PAYLOADS.welcome;
EXAMPLE_SAMPLE_PAYLOADS.InvoiceEmail = EXAMPLE_SAMPLE_PAYLOADS.invoice;
EXAMPLE_SAMPLE_PAYLOADS.NoticeEmail = EXAMPLE_SAMPLE_PAYLOADS.notice;
