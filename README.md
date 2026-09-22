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

## Major Refactoring Report

This library underwent a significant refactoring to transition from a hardcoded template system to a truly generic template generation engine.

### Session Summary

**Goal**: Remove leftover code from the original project and make the library truly generic.

**Result**: The library now requires consumers to provide all templates, catalogs, and sample data.

### Changes Made

#### 1. Architecture Change: Library Genericization
- **Before**: Library included hardcoded templates and catalogs from the original project
- **After**: Library is completely generic - consumers provide everything
- **Impact**: Breaking change for existing users, but provides proper library architecture

#### 2. Template Files Migration
- **Moved**: All 6 template files from `src/templates/` to `sandbox/templates/`
- **Created**: `sandbox/example-catalog.ts` with example catalog structure
- **Created**: `sandbox/example-usage.ts` demonstrating proper library usage
- **Created**: `sandbox/README.md` with sandbox-specific documentation

#### 3. API Cleanup
- **Removed**: Exports of hardcoded `CATALOG` and `SAMPLE_PAYLOADS` from main index
- **Updated**: `generator.ts` to use empty defaults instead of hardcoded catalog
- **Deprecated**: Compatibility layer functions with clear JSDoc warnings
- **Enhanced**: CLI to error gracefully when no catalog is configured

#### 4. Test Modernization
- **Updated**: All tests to use dynamic catalogs instead of hardcoded ones
- **Fixed**: Test imports to use main API instead of compatibility layer
- **Added**: Tests for empty catalog scenarios
- **Added**: Catalog validation tests

#### 5. Code Quality Improvements
- **Unified**: Type definitions (removed duplicate interfaces)
- **Genericized**: Date handling (removed hardcoded field assumptions)
- **Enhanced**: Error handling for missing directories
- **Added**: `allowMissingDirectories` configuration option

#### 6. Documentation Updates
- **Updated**: Main README to reflect generic library approach
- **Created**: AGENTS.md for AI agent development guidance
- **Updated**: Migration context and common pitfalls documentation
- **Added**: Clear migration examples and usage patterns

### Migration Guide for Existing Users

If you were using the previous version with hardcoded templates:

```typescript
// Old way (no longer works)
import { CATALOG, SAMPLE_PAYLOADS } from '@llazyemail/generate-template';
const gen = createGenerator({ catalog: CATALOG, samplePayloads: SAMPLE_PAYLOADS });

// New way (required)
import { createGenerator } from '@llazyemail/generate-template';

// Define your own catalog
const MY_CATALOG = [
  {
    ids: ['welcome', 'WelcomeEmail'],
    file: 'welcomeEmail.ts',
    exportName: 'WelcomeEmail',
  },
  // ... your other templates
];

const MY_SAMPLE_PAYLOADS = {
  welcome: { name: 'Alex' },
  // ... your sample data
};

const gen = createGenerator({
  catalog: MY_CATALOG,
  samplePayloads: MY_SAMPLE_PAYLOADS,
  templatesDir: 'path/to/your/templates',
});
```

### Benefits of This Refactoring

1. **True Library**: The package is now a proper library, not a bundled application
2. **Flexibility**: Consumers can use any template structure they want
3. **Maintainability**: No need to maintain example templates in the library
4. **Clarity**: Clear separation between library and example usage
5. **Type Safety**: Better type definitions and validation
6. **Error Handling**: Improved error messages and handling

### Files Changed

**Library Core:**
- `src/template-catalog.ts` - Changed to empty defaults with deprecation warnings
- `src/generator.ts` - Updated to use empty defaults
- `src/generate-template.ts` - Added deprecation warnings
- `src/index.ts` - Removed catalog/payload exports
- `src/cli.ts` - Added empty catalog error handling
- `src/resolve.ts` - Added catalog validation
- `src/payload.ts` - Enhanced error handling
- `src/render.ts` - Genericized date handling

**Tests:**
- `src/generator.test.ts` - Updated for dynamic catalogs
- `src/generate-template.test.ts` - Complete rewrite for new API
- `src/template-catalog.test.ts` - Updated for generic catalog validation
- `src/index.test.ts` - Updated description

**New Files:**
- `sandbox/templates/*` - 6 example template files
- `sandbox/example-catalog.ts` - Example catalog configuration
- `sandbox/example-usage.ts` - Usage demonstration
- `sandbox/README.md` - Sandbox documentation
- `AGENTS.md` - AI agent development guide

### Breaking Changes

- **CATALOG and SAMPLE_PAYLOADS**: No longer exported from main index
- **Default templates**: Removed from library
- **Compatibility layer**: Marked as deprecated
- **CLI behavior**: Errors when no catalog is configured

### Future Recommendations

1. **Consider removing compatibility layer**: After a deprecation period, remove `generate-template.ts`
2. **Add more examples**: Expand sandbox with different template patterns
3. **Documentation**: Add more migration examples and best practices
4. **Type validation**: Consider adding runtime schema validation
5. **Plugin system**: Consider adding a plugin system for common template patterns

This refactoring transforms the package from a project-specific tool into a proper, reusable library that consumers can adapt to their specific needs.
