# AI Agent Development Guide

This file contains information to help AI agents understand and work with this project effectively.

## Project Overview

**@llazyemail/generate-template** is a configurable template generation engine for rendering email templates to HTML. It was migrated from another project and refactored to be a standalone npm package.

### Key Characteristics
- **Language**: TypeScript (ESM)
- **Node Version**: >= 20
- **Package Manager**: npm
- **Testing**: Vitest
- **Build Tool**: tsup
- **Registry**: GitHub Packages (@llazyemail scope)
- **Architecture**: Generic library - consumers provide all templates and catalogs

## Project Structure

```
generate-template/
├── src/
│   ├── generator.ts          # Main TemplateGenerator class
│   ├── types.ts              # TypeScript interfaces and types
│   ├── template-catalog.ts   # Default catalog and sample payloads
│   ├── payload.ts            # Payload loading and date serialization
│   ├── render.ts             # Template rendering logic
│   ├── resolve.ts            # Catalog lookup and slug generation
│   ├── cli.ts                # CLI argument parsing and execution
│   ├── html.ts               # Simple HTML generator utility
│   ├── generate-template.ts  # Legacy compatibility layer
│   ├── index.ts              # Main API exports
│   └── templates/            # Template files (created during migration)
├── dist/                     # Build output (generated)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

## Development Commands

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Build the project
npm run build

# Build and publish (maintainers only)
npm run prepublishOnly
```

## Key API Patterns

### Main API: createGenerator()

The primary way to use this package is through `createGenerator()`:

```typescript
import { createGenerator } from '@llazyemail/generate-template';

const generator = createGenerator({
  catalog: [...],           // Template catalog entries
  samplePayloads: {...},    // Sample/test data
  root: process.cwd(),      // Project root (default: process.cwd())
  templatesDir: 'src/templates',  // Template files location
  dataDir: 'src/data',      // Data files location
  outDir: 'generated',     // Output directory
  skipFiles: [...],         // Files to skip in template listing
  allowMissingDirectories: false,  // Allow missing dirs with better errors
});
```

### Template Catalog Entry Structure

```typescript
interface TemplateCatalogEntry {
  ids: string[];                    // Template identifiers (case-insensitive)
  file?: string;                    // Template file (if file-based)
  exportName?: string;              // Export name to use from file
  render?: TemplateRenderer;        // Direct render function or object
  description?: string;             // Human-readable description
}

type TemplateRenderer = 
  | ((payload: unknown) => string)
  | { render: (payload: unknown) => string };
```

### Rendering Priority

1. Direct `render` function (if provided)
2. File-based template (if `file` and `exportName` provided)

## Important Code Conventions

### 1. Type Safety
- Always use the `TemplateCatalogEntry` interface from `types.ts`
- Never use the old duplicate interface from `template-catalog.ts`
- Use proper TypeScript types for all function parameters

### 2. Date Handling
- Date serialization uses a special `__date` field for JSON transport
- Date revival is generic - no hardcoded field names
- The `reviveDates()` function handles both `__date` objects and ISO date strings
- Example: `serializePayload({ date: new Date() })` creates `{"date":{"__date":"..."}}`

### 3. Error Handling
- Always check directory existence before file operations
- Use descriptive error messages that include the full path
- The `allowMissingDirectories` config option controls strictness
- Gracefully handle missing directories when appropriate

### 4. Path Resolution
- All paths are resolved relative to the consuming project's `root`, not this package
- Use `path.resolve()` for absolute paths
- Never assume this package's directory structure

### 5. Case Insensitivity
- Template ID lookup is case-insensitive
- `findEntry()` converts both catalog IDs and search terms to lowercase

## Testing Patterns

### Test File Organization
- Test files are co-located with source files: `*.test.ts`
- Use Vitest for testing
- Clean up temporary directories in `afterEach` hooks

### Common Test Patterns

```typescript
// Temporary directory management
const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Generator with custom config
const gen = createGenerator({
  catalog: [{ ids: ['test'], render: () => 'test' }],
  samplePayloads: { test: {} },
});

// Error message testing with flexible regex
expect(() => someFunction()).toThrow(/Error pattern|Alternative pattern/);
```

## Migration Context

This project was migrated from another application and underwent significant refactoring:

### Library Philosophy
- **No default templates**: The library is now truly generic - consumers must provide their own catalog and templates
- **Sandbox examples**: Template files and catalogs have been moved to `sandbox/` for demonstration purposes
- **Consumer-controlled**: All configuration (catalog, payloads, paths) is provided by the consuming project

### Legacy Compatibility Layer
- `generate-template.ts` provides compatibility with the old API (marked as deprecated)
- New code should use `createGenerator()` from the main index
- The compatibility layer uses empty defaults and requires consumer configuration
- CLI will error if no catalog is configured

### What Was Fixed
1. **Type conflicts**: Unified duplicate interface definitions
2. **Removed hardcoded catalog**: Moved templates to sandbox, made library truly generic
3. **Import organization**: Separated main API from legacy compatibility
4. **Date handling**: Removed hardcoded field assumptions
5. **Error handling**: Added robust directory and file checks
6. **Test coverage**: Updated tests to use dynamic catalogs instead of hardcoded ones

## Common Pitfalls

### 1. Directory Assumptions
❌ **Don't**: Assume `src/templates` or `src/data` exist
✅ **Do**: Check directory existence or use `allowMissingDirectories`

### 2. Package-relative Paths
❌ **Don't**: Use paths relative to this package's location
✅ **Do**: Use paths relative to the consuming project's `root`

### 3. Hardcoded Date Fields
❌ **Don't**: Special-case specific field names like `signupDate`
✅ **Do**: Use generic date revival that works for any field

### 4. Type Duplication
❌ **Don't**: Define duplicate interfaces
✅ **Do**: Import from `types.ts` and extend if needed

### 5. Synchronous File Operations
❌ **Don't**: Use async file operations where sync is expected
✅ **Do**: Use `fs.*Sync` methods consistently

### 6. Assuming Default Catalog
❌ **Don't**: Assume the library provides default templates or catalogs
✅ **Do**: Always provide your own catalog and sample payloads via `createGenerator()`

### 7. Using Deprecated API
❌ **Don't**: Use functions from `generate-template.ts` in new code
✅ **Do**: Use `createGenerator()` and the main API from `index.ts`

## Build and Publishing

### Build Process
- Uses `tsup` to build both CJS and ESM outputs
- Generates TypeScript declaration files
- Creates standalone CLI executable
- Outputs to `dist/` directory

### Publishing
- Published to GitHub Packages registry
- Requires GitHub PAT with `read:packages` scope
- Automated via GitHub Actions workflow
- Scoped as `@llazyemail/generate-template`

## Code Quality Standards

- **Type Safety**: All code must pass `tsc --noEmit`
- **Test Coverage**: Maintain existing test coverage
- **Error Messages**: Provide descriptive, actionable error messages
- **Documentation**: Update README.md and AGENTS.md for significant changes
- **Backward Compatibility**: Maintain compatibility layer where possible

## When to Ask for Help

- When changing the core rendering logic
- When modifying the catalog structure
- When dealing with build/publishing issues
- When breaking backward compatibility
- When unsure about migration-related code patterns

## Getting Started Checklist

- [ ] Run `npm test` to ensure tests pass
- [ ] Run `npm run typecheck` to verify types
- [ ] Review existing test patterns before adding new tests
- [ ] Check AGENTS.md for project-specific conventions
- [ ] Update this file if you learn new patterns
- [ ] Test both file-based and function-based rendering
- [ ] Verify error handling for missing directories
