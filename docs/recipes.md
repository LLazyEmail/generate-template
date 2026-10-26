# Recipes

Step-by-step changes. Each lists exact files; verify with the cheapest command listed, then run the `AGENTS.md` finish line (`npm run typecheck && npm test`) before handing off.

## Add a CLI flag

1. `src/engine/types.ts` — add the field to `CliArgs`.
2. `src/cli.ts` — parse it in `parseArgs` (boolean flags need their own `if (arg === '--x')` branch; values use the `--x=value` regex), consume it in `main` / `requestsFromArgs`, and document it in `USAGE`.
3. `tests/cli.test.ts` — cover parsing and behavior. Tests call `main(argv, generator)` with an injected generator, so no config file is needed.

Verify: `npx vitest run tests/cli.test.ts`, then `npm run build && node dist/cli.js --help`.

## Add an error code

1. `src/engine/errors.ts` — extend `GenerateTemplateErrorCode`.
2. Throw site — `new GenerateTemplateError('NEW_CODE', message, templateId)`.
3. `tests/engine/errors.test.ts` plus the test of the module that throws.
4. Update the code lists in `README.md`, the contracts section of `AGENTS.md`, and the error table in `docs/architecture.md`.

Verify: `npx vitest run tests/engine`. The HTTP-seam test maps any `GenerateTemplateError` to 400 + code generically, so it keeps passing.

## Add a GeneratorConfig option

1. `src/engine/types.ts` — add to `GeneratorConfig` (and to `RenderOptions` / `WriteOptions` if it must travel with requests).
2. `src/engine/generator.ts` — normalize in the constructor (`config.x ?? default` pattern).
3. Consume it in `src/engine/render.ts` or `src/engine/payload.ts` by passing it through — the engine must not reach into adapters.
4. Wire any adapter-dependent behavior in `src/create-generator.ts` only.
5. `tests/engine/generator.test.ts` — assert the default and the override.

Verify: `npx vitest run tests/engine`.

## Change slug rules

Edit `src/catalog/resolve.ts` `slugFromId` (current rules: strip trailing `Email`, camelCase → kebab-case, lowercase, fallback = slugified input). Slugs become output file names and assert keys, so also run the CLI, catalog, and assert suites plus the sandbox.

Verify: `npx vitest run tests/catalog tests/cli.test.ts tests/assert-generated.test.ts && npm run sandbox`.

## Add a sandbox fixture

1. `sandbox/example-catalog.ts` — add a `render` fixture entry and a sample payload. If the entry has several ids, alias the payload keys too (see the `WelcomeEmail` aliases at the bottom of the file).
2. `sandbox/example-usage.ts` — the write loop is generic; add a text assertion only if the fixture has a unique invariant.
3. `sandbox/sandbox.test.ts` — the fixture-count assertion must be updated.

Verify: `npm run sandbox` (builds first), then `npx vitest run sandbox`.

## Add a public export

1. `src/index.ts` — export it. Everything reachable here is package API; consumers import only from the root.
2. `tests/index.test.ts` — assert the export.
3. If it supersedes a re-export from `markup-generator` (`pathExists`, `loadData`, ...), do not re-implement it — those re-exports are deliberate.

Verify: `npx vitest run tests/index.test.ts`.

## Release

Full flow: [`docs/changesets.md`](changesets.md).

1. Add a changeset — either `npx changeset` locally, or **Actions → Add changeset** (bump + summary; it opens a PR with the `.changeset/*.md` file).
2. Merge to main; the changesets action opens a "Version packages" PR that bumps `package.json`, the lockfile, and `CHANGELOG.md`.
3. Merging that PR creates a GitHub Release, which triggers `npm-publish.yml` (full gate → `npm publish`).

Never edit `package.json` `version` or `CHANGELOG.md` by hand, and never create a GitHub Release before the Version Packages PR is merged.

## Migrate a sibling repo off local scripts

Follow `MIGRATION.md` (old script → package equivalents). Prove it with the sandbox pattern: `npm run sandbox` in this repo, then `generate-template --list` in the consumer.
