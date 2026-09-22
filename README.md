# @llazyemail/generate-template

Standalone engine for turning named email templates into HTML.
Published to **GitHub Packages** as `@llazyemail/generate-template`.

Requires **Node.js >= 20**.

## Why this package is structured this way

The generator started as a script cut out of another project. That script assumed it still lived inside that app:

- paths were relative to this package, not the consumer
- catalog entries were hardcoded file names from the other repo
- `renderOne` always spawned Node to import those files
- importing the module assumed a local CLI project layout (`src/templates`, `src/data`, package-relative `ROOT`)

An npm package cannot look next to itself for `src/templates` and `src/data`. Those files belong to the consuming project, or they are passed in as functions.

`createGenerator(config)` is the public API. The consumer supplies the catalog and how to render.

**Important**: This library no longer includes default templates or catalogs. Consumers must provide their own catalog and sample payloads. See the `sandbox/` directory for examples.

Render order:

1. an injected `render` function (or an object with `{ render() }`)
2. an optional file on the consumer’s disk

## Install from GitHub Packages

GitHub Packages is a scoped registry. Add this to the consuming project `.npmrc` (see `.npmrc.example`):

```ini
@llazyemail:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` must be a GitHub PAT with `read:packages` (and SSO authorized for the `LLazyEmail` org if required). Then:

```bash
npm install @llazyemail/generate-template
```

## Library

Bind templates from the consuming project. No files inside this package are required:

```ts
import { createGenerator } from '@llazyemail/generate-template';
import { WelcomeEmail } from './emails/welcome';

const generate = createGenerator({
  catalog: [
    {
      ids: ['welcome', 'WelcomeEmail'],
      render: WelcomeEmail,
    },
  ],
  samplePayloads: {
    welcome: { name: 'Alex' },
  },
});

const html = generate.render('welcome');
const file = generate.write('welcome', { out: 'generated/welcome.html' });
```

Same engine, old layout, when you still have the original project on disk:

```ts
import { createGenerator } from '@llazyemail/generate-template';

// Define your own catalog (or copy from sandbox/example-catalog.ts)
const MY_CATALOG = [
  {
    ids: ['welcome', 'WelcomeEmail'],
    file: 'welcomeEmail.ts',
    exportName: 'WelcomeEmail',
  },
  // ... more templates
];

const MY_SAMPLE_PAYLOADS = {
  welcome: { name: 'Alex' },
  // ... more sample payloads
};

const generate = createGenerator({
  root: process.cwd(),
  templatesDir: 'src/templates',
  dataDir: 'src/data',
  catalog: MY_CATALOG,
  samplePayloads: MY_SAMPLE_PAYLOADS,
});
```

`root` / `templatesDir` / `dataDir` resolve against the consuming project, not against `node_modules/@llazyemail/generate-template`.

## CLI

```bash
npx @llazyemail/generate-template --list
npx @llazyemail/generate-template --template=welcome --out=generated/welcome.html
npx @llazyemail/generate-template --all --out=generated
```

The CLI uses `createGenerator()` with `process.cwd()`.

## Scripts

```bash
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup (CJS + ESM + types + CLI)
```

## Publish (maintainers)

1. Bump `version` in `package.json`.
2. Create a GitHub Release on `main` (tag `v0.1.0`, etc.).
3. `.github/workflows/npm-publish.yml` builds, tests, and runs `npm publish` against `https://npm.pkg.github.com` using `GITHUB_TOKEN`.

Use **Actions → Publish to GitHub Packages → Run workflow** with `dry_run` to pack without publishing.

The package name **must** stay scoped as `@llazyemail/...` — GitHub Packages only accepts names that match the owner.

After the first successful publish, the package appears under the repo **Packages** tab:
https://github.com/LLazyEmail/generate-template/pkgs/npm/generate-template

## Recent Code Improvements

The codebase has been significantly improved to address migration issues and enhance robustness:

### Major Refactoring: Library Genericization
- **Removed hardcoded catalog**: The library no longer includes default templates or catalogs
- **Sandbox examples**: Moved all template files to `sandbox/` directory for demonstration
- **Consumer-controlled configuration**: All catalogs, payloads, and templates must be provided by consumers
- **Updated CLI**: CLI now errors gracefully when no catalog is configured
- **Deprecated compatibility layer**: Marked old API functions as deprecated with clear warnings

### 1. Type Definitions Unified
- Removed duplicate `TemplateCatalogEntry` interface from `template-catalog.ts`
- Now uses a single interface from `types.ts` with optional `file`, `exportName`, `render`, and added `description` field
- Updated tests to handle the optional nature of file-based entries

### 2. Template Files Moved to Sandbox
Moved all 6 template files from `src/templates/` to `sandbox/templates/`:
- `password-reset.definition.ts` - Password reset email template
- `order-confirmation.definition.ts` - Order confirmation template
- `welcomeEmail.ts` - Welcome email template
- `invoiceEmail.ts` - Invoice email template
- `trialExpiringEmail.ts` - Trial expiration reminder
- `userInvitationEmail.ts` - User invitation template

### 3. Fixed Imports and API Structure
- Reorganized exports to clearly separate main API from legacy compatibility layer
- Main API: `createGenerator`, `TemplateGenerator`, catalog functions
- Legacy API: marked as deprecated with JSDoc comments
- Simple HTML generator kept as utility function
- Removed exports of empty CATALOG and SAMPLE_PAYLOADS from main index

### 4. Made Date Handling Generic
- Removed hardcoded `signupDate` special handling from `payload.ts`
- Removed hardcoded `signupDate` logic from `render.ts`
- Date revival now works generically for any date field
- Added test to verify generic date handling

### 5. Added Proper Error Handling
- Added try-catch in `listTemplateFiles()` with descriptive error messages
- Added data directory existence check in `loadPayload()` before attempting file reads
- Added `allowMissingDirectories` configuration option for flexible error handling
- Added helpful error messages when directories don't exist
- CLI now provides clear error when no catalog is configured

### 6. Updated Tests for Dynamic Catalogs
- All tests now use dynamic catalogs instead of hardcoded ones
- Tests create their own catalogs and sample payloads
- Removed dependencies on the original hardcoded catalog
- Added tests for empty catalog scenarios

### 7. Example Usage and Documentation
- Created `sandbox/example-catalog.ts` showing how to structure a catalog
- Created `sandbox/example-usage.ts` demonstrating library usage
- Created `sandbox/README.md` with sandbox-specific documentation
- Updated main README to reflect the new generic library approach

These improvements make the codebase truly generic, maintainable, type-safe, and robust while providing clear migration paths for existing users.
