# Sandbox / Examples

This directory contains example templates and usage patterns for the `@llazyemail/generate-template` library.

## Structure

```
sandbox/
├── templates/           # Example template files
├── example-catalog.ts   # Example catalog configuration
├── example-usage.ts     # Example usage code
└── README.md           # This file
```

## Usage

### Running the Example

First, build the main library:

```bash
npm run build
```

Then run the example:

```bash
node --experimental-strip-types sandbox/example-usage.ts
```

### Using the Example Catalog

The `example-catalog.ts` shows how to structure your own template catalog:

```typescript
import { EXAMPLE_CATALOG, EXAMPLE_SAMPLE_PAYLOADS } from './sandbox/example-catalog.js';
import { createGenerator } from '@llazyemail/generate-template';

const generator = createGenerator({
  catalog: EXAMPLE_CATALOG,
  samplePayloads: EXAMPLE_SAMPLE_PAYLOADS,
  templatesDir: 'sandbox/templates',
  // ... other config
});
```

## Template Files

The `templates/` directory contains example email templates:

- `password-reset.definition.ts` - Password reset email
- `order-confirmation.definition.ts` - Order confirmation email
- `welcomeEmail.ts` - Welcome email for new users
- `invoiceEmail.ts` - Invoice email
- `trialExpiringEmail.ts` - Trial expiration reminder
- `userInvitationEmail.ts` - User invitation email

Each template exports a function that takes a payload object and returns HTML string.

## Creating Your Own Templates

1. Create your template file in your project's templates directory
2. Add an entry to your catalog with the template's file path and export name
3. Create sample payloads for testing
4. Use `createGenerator()` with your custom configuration

## Migration from Original Project

If you're migrating from the original project structure:

1. Copy your template files to your project's templates directory
2. Create a catalog file that references your templates
3. Update your code to use `createGenerator()` instead of the old API
4. Remove dependencies on the hardcoded catalog from the library

## Important Notes

- The library no longer includes default templates or catalogs
- Consumers must provide their own catalog and sample payloads
- Template files can be either TypeScript or JavaScript
- The sandbox examples use the original templates for demonstration purposes
