import type { TemplateCatalogEntry } from '../src/engine/types.ts';
import { passwordReset } from './templates/password-reset.definition.ts';
import { orderConfirmation } from './templates/order-confirmation.definition.ts';
import { WelcomeEmail } from './templates/welcomeEmail.ts';
import { InvoiceEmail } from './templates/invoiceEmail.ts';
import { TrialExpiringEmail } from './templates/trialExpiringEmail.ts';
import { UserInvitationEmail } from './templates/userInvitationEmail.ts';

export const EXAMPLE_CATALOG: TemplateCatalogEntry[] = [
  {
    ids: ['password-reset', 'PasswordResetEmail'],
    render: passwordReset,
    description: 'Password reset email',
  },
  {
    ids: ['order-confirmation', 'OrderConfirmationEmail'],
    render: orderConfirmation,
    description: 'Order confirmation email',
  },
  {
    ids: ['welcome', 'WelcomeEmail'],
    render: WelcomeEmail,
    description: 'Welcome email for new users',
  },
  {
    ids: ['invoice', 'InvoiceEmail'],
    render: InvoiceEmail,
    description: 'Invoice email',
  },
  {
    ids: ['trial-expiring', 'TrialExpiringEmail'],
    render: TrialExpiringEmail,
    description: 'Trial expiration reminder',
  },
  {
    ids: ['user-invitation', 'UserInvitationEmail'],
    render: UserInvitationEmail,
    description: 'User invitation email',
  },
];

export const EXAMPLE_SAMPLE_PAYLOADS: Record<string, unknown> = {
  'password-reset': {
    name: 'Jordan',
    preheader: 'Use this link to reset your password.',
    action_url: 'https://example.com/reset?token=fixture-token-123',
    operating_system: 'macOS',
    browser_name: 'Chrome',
    support_url: 'https://example.com/support',
    product_name: '[Product Name]',
    company_name: 'Acme Inc.',
    company_address: '1234 Street Rd.',
    company_suite: 'Suite 1234',
    company_url: 'https://example.com',
  },
  'order-confirmation': {
    name: 'Jordan',
    preheader: 'Thanks for your order #1001.',
    order_id: '1001',
    order_date: 'January 5, 2026',
    total: '$49.00',
    order_items: [
      { description: 'Pro Plan - monthly', unit_price: '$49.00', quantity: '1', total: '$49.00' },
    ],
    shipping_address: 'Jordan Lee\n1234 Street Rd.\nSuite 1234',
    billing_address: '',
    action_url: 'https://example.com/orders/1001',
    support_url: 'https://example.com/support',
    product_name: '[Product Name]',
    company_name: 'Acme Inc.',
    company_address: '1234 Street Rd.',
    company_suite: 'Suite 1234',
    company_url: 'https://example.com',
  },
  welcome: {
    userName: 'Alex',
    signupDate: new Date('2026-01-05T12:00:00Z'),
    preheader: 'Welcome aboard.',
    action_url: 'https://example.com/confirm',
    action_label: 'Confirm email',
    support_url: 'https://example.com/support',
    product_name: '[Product Name]',
    company_name: '[Company Name, LLC]',
    company_address: '1234 Street Rd.',
    company_suite: 'Suite 1234',
    company_url: 'https://example.com',
  },
  invoice: {
    name: 'Alex',
    preheader: 'Invoice for Jan 5, 2026.',
    invoice_id: 'INV-2026-0001',
    date: 'January 5, 2026',
    total: '$49.00',
    due_date: 'January 12, 2026',
    purchase_date: 'January 5, 2026',
    action_url: 'https://example.com/invoices/INV-2026-0001/pay',
    support_url: 'https://example.com/support',
    invoice_details: [{ description: 'Pro Plan', amount: '$49.00' }],
    product_name: '[Product Name]',
    company_name: '[Company Name, LLC]',
    company_address: '1234 Street Rd.',
    company_suite: 'Suite 1234',
    company_url: 'https://example.com',
  },
  'trial-expiring': {
    name: 'Alex',
    preheader: 'Your Pro trial ends in 3 days.',
    trial_end_date: 'January 19, 2026',
    trial_days_remaining: '3',
    plan_name: 'Pro',
    plan_price: '$29.00 / month',
    action_url: 'https://example.com/billing/upgrade',
    secondary_url: 'https://example.com/pricing',
    support_url: 'https://example.com/support',
    benefits: [{ title: 'Unlimited projects' }, { title: 'Priority support' }],
    product_name: '[Product Name]',
    company_name: '[Company Name, LLC]',
    company_address: '1234 Street Rd.',
    company_suite: 'Suite 1234',
    company_url: 'https://example.com',
  },
  'user-invitation': {
    invitee_name: 'Alex',
    invitee_email: 'alex@example.com',
    inviter_name: 'Sam',
    workspace_name: 'Acme',
    role: 'Member',
    preheader: 'Sam invited you to join Acme.',
    action_url: 'https://example.com/invites/accept',
    decline_url: 'https://example.com/invites/decline',
    expires_at: 'January 12, 2026',
    support_url: 'https://example.com/support',
    product_name: '[Product Name]',
    company_name: '[Company Name, LLC]',
    company_address: '1234 Street Rd.',
    company_suite: 'Suite 1234',
    company_url: 'https://example.com',
  },
};

EXAMPLE_SAMPLE_PAYLOADS.PasswordResetEmail = EXAMPLE_SAMPLE_PAYLOADS['password-reset'];
EXAMPLE_SAMPLE_PAYLOADS.OrderConfirmationEmail = EXAMPLE_SAMPLE_PAYLOADS['order-confirmation'];
EXAMPLE_SAMPLE_PAYLOADS.WelcomeEmail = EXAMPLE_SAMPLE_PAYLOADS.welcome;
EXAMPLE_SAMPLE_PAYLOADS.InvoiceEmail = EXAMPLE_SAMPLE_PAYLOADS.invoice;
EXAMPLE_SAMPLE_PAYLOADS.TrialExpiringEmail = EXAMPLE_SAMPLE_PAYLOADS['trial-expiring'];
EXAMPLE_SAMPLE_PAYLOADS.UserInvitationEmail = EXAMPLE_SAMPLE_PAYLOADS['user-invitation'];
