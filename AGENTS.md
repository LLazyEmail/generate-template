# AI Agent Development Guide

`@llazyemail/generate-template` is a generic engine. It does not ship templates. Consumers pass a catalog and render functions.

- Language: TypeScript, ESM
- Node: >= 22.18
- Package manager: npm (`npm ci` in CI)
- Tests: Vitest, coverage gate on `src/engine`
- Build: tsup
- Registry: GitHub Packages (`https://npm.pkg.github.com`)
- Versions: Changesets. Do not hand-bump `package.json` for a feature; add a changeset.

## Layout

```
src/
  index.ts              # public exports
  create-generator.ts   # the only createGenerator factory
  cli.ts                # parseArgs, main, --help
  bin.ts                # CLI entry, no argv self-check
  bin-assert.ts         # assert bin entry
  config.ts             # --config / package.json / generate-template.config.*
  assert-generated.ts   # generated HTML check
  engine/               # TemplateGenerator, run, payload, errors
  catalog/              # id lookup and slug
  persist/              # disk writes via markup-generator
  adapters/             # file renderer and payload files
sandbox/                # package-owned fixtures, not published
tests/                  # unit tests
.changeset/             # version fragments
```

## Commands

```bash
npm ci
npm test
npm run test:coverage
npm run typecheck
npm run lint
npm run build
npm run sandbox
npx changeset
```

## Rules

- Import `createGenerator` from `src/create-generator.ts` or the package entry. Do not define a second factory.
- `run({ write })` must render once. Pass the HTML already rendered into the writer.
- Disk writes go through `markup-generator`.
- Do not add default templates to `src/`. Put proofs in `sandbox/`.
- `package.json` `files` is an allowlist. Do not publish `sandbox/`, `src/`, or `tests/`.
- Template lookup is case-insensitive. Slugs come from the first catalog id.
- Date revival is off unless `reviveDates: true`.
- Failures are `GenerateTemplateError` with `code`: `UNKNOWN_TEMPLATE` | `NO_PAYLOAD` | `RENDER_FAILED` | `WRITE_FAILED` | `INVALID_CONFIG`.
