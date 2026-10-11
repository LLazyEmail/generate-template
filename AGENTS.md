# Agent Guide — @llazyemail/generate-template

Generic engine that turns named email templates into HTML. It ships **no templates**: consumers pass a catalog (`ids` + `render`) and payloads to `createGenerator`. Ground truth: `src/` for behavior, `tests/` for contracts, `package.json` for the published surface.

Facts: TypeScript ESM · Node >= 22.18 · npm · Vitest · tsup → `dist/` (cjs+esm; bins esm) · GitHub Packages · Changesets.

## Verify — cheapest first

| You changed                           | Run                                     | Skip                          |
| ------------------------------------- | --------------------------------------- | ----------------------------- |
| Docs/comments only                    | nothing                                 | everything                    |
| One module's behavior                 | `npx vitest run tests/<mirror>.test.ts` | full suite                    |
| Anything in `src/` (before finishing) | `npm run typecheck && npm test`         | lint, coverage                |
| CLI, bins, tarball surface            | `npm run build && npm run sandbox`      | —                             |
| Engine code paths                     | `npm run test:coverage`                 | `npm test` (coverage runs it) |

- Vitest does not typecheck; `npm run typecheck` covers `src/` only. `tests/` and `sandbox/` are never typechecked — keep them simple.
- `npm test` includes `tests/publish-files.test.ts`, which builds and `npm pack --dry-run`s — slower than the unit tests.
- CI (`.github/workflows/ci.yml`) owns typecheck, lint, build, coverage. Run `npm run lint` locally only if you touched `eslint.config.js`.
- `npm run sandbox` builds first, renders the three fixtures through `dist/` into `sandbox/generated/`; open `index.html` there.
- If a failure is environmental (missing deps, registry auth), state it once and move on. Do not spend runs proving it is pre-existing.

## Map

| Path                              | Purpose                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                    | Public exports — the only import surface for consumers                                                                          |
| `src/create-generator.ts`         | The one factory; injects disk adapters into the engine                                                                          |
| `src/engine/`                     | `TemplateGenerator` (find/slug/render/write/writeAll/run), payload resolution, render precedence, `GenerateTemplateError`       |
| `src/catalog/`                    | Case-insensitive id lookup; slug derivation                                                                                     |
| `src/persist/`                    | `Writer`; all generated-file writes go through `markup-generator`                                                               |
| `src/adapters/`                   | Opt-in file renderer (spawn), `.data.js` payload files, CLI file listing                                                        |
| `src/cli.ts`                      | `parseArgs`, `main`, `wantsAll`, `USAGE`; flags `--list --all --template= --data= --out= --config=` and the `assert` subcommand |
| `src/config.ts`                   | Config discovery and module contract for the bins                                                                               |
| `src/assert-generated.ts`         | Generated-HTML check (pure function + CLI adapter)                                                                              |
| `src/bin.ts`, `src/bin-assert.ts` | Thin bin entries; no argv self-check                                                                                            |
| `sandbox/`                        | Package-owned fixtures and live proof; never published                                                                          |
| `tests/`                          | Unit contracts mirroring `src/`                                                                                                 |
| `docs/`                           | On-demand agent docs (see below)                                                                                                |
| `.changeset/`                     | Pending release notes                                                                                                           |

## Contracts (must hold)

1. `run({ write })` renders exactly once — HTML is passed into the writer. `write` only controls persistence, it never re-renders.
2. `createGenerator` (`src/create-generator.ts`) is the only factory. `createEngine` is internal, and `src/engine/` must not import `src/adapters/` — adapters are injected through config.
3. Generated HTML reaches disk only through `src/persist/` → `markup-generator`.
4. Lookup is case-insensitive over all `ids`; slug = first id of the matched entry, trailing `Email` stripped, camelCase → kebab-case, lowercased (`src/catalog/resolve.ts`).
5. Payload order: request `payload` → `dataPath` → `samplePayloads[templateId]` (exact key, must be truthy) → data files when `useDataFiles` → `NO_PAYLOAD`.
6. Render order: `entry.render` → `entry.file` (requires `allowFileTemplates: true`) → `RENDER_FAILED`.
7. Failures are `GenerateTemplateError` with `code`: `UNKNOWN_TEMPLATE` | `NO_PAYLOAD` | `RENDER_FAILED` | `WRITE_FAILED` | `INVALID_CONFIG`.
8. Dates stay JSON-safe (`{ "__date": iso }` marker); revival happens only with `reviveDates: true`.
9. Fixtures live in `sandbox/`, never in `src/`. `package.json` `files` is the publish allowlist; `tests/publish-files.test.ts` enforces it.
10. Versions move via `npx changeset` — never hand-edit `package.json` version.

## Task router

| Task                                        | Read first                      | Edit                                 | Verify                                          |
| ------------------------------------------- | ------------------------------- | ------------------------------------ | ----------------------------------------------- |
| Engine behavior (render/run/payload/errors) | `src/engine/*.ts` + mirror test | same                                 | `npx vitest run tests/engine`                   |
| CLI flags / usage text                      | `src/cli.ts`                    | `src/cli.ts`, `tests/cli.test.ts`    | `npx vitest run tests/cli.test.ts`              |
| Config discovery / module contract          | `src/config.ts`                 | `src/config.ts`, `tests/cli.test.ts` | `npx vitest run tests/cli.test.ts`              |
| Assert command                              | `src/assert-generated.ts`       | + `tests/assert-generated.test.ts`   | `npx vitest run tests/assert-generated.test.ts` |
| Slug / id lookup                            | `src/catalog/resolve.ts`        | + `tests/catalog/catalog.test.ts`    | `npx vitest run tests/catalog`                  |
| Write / persist                             | `src/persist/writer.ts`         | + `tests/persist/writer.test.ts`     | `npx vitest run tests/persist`                  |
| File renderer / data files                  | `src/adapters/`                 | + mirror tests                       | `npx vitest run tests/adapters`                 |
| Sandbox fixture / proof                     | `sandbox/example-catalog.ts`    | + `sandbox/example-usage.ts`         | `npm run sandbox`                               |
| Public exports                              | `src/index.ts`                  | + `tests/index.test.ts`              | `npx vitest run tests/index.test.ts`            |
| Multi-file change                           | `docs/recipes.md`               | per recipe                           | per recipe                                      |

## Do not

- Do not edit `dist/` — it is build output; edit `src/` and rebuild.
- Do not add a second factory, or default templates, to `src/`.
- Do not add an argv self-check to `src/bin.ts` — the bins must run through npm `.bin` symlinks.
- Do not convert the spawn-based file renderer into a direct import — spawning is the documented behavior for file templates.
- Do not run watchers (`test:watch`) or repo-wide `npm run format` in agent sessions; format only the files you touched with `npx prettier --write <file>`.

## More (open on demand)

- `docs/architecture.md` — execution flows, every resolution order, error-site table, CLI reference, release pipeline.
- `docs/recipes.md` — step-by-step changes: add flag / error code / config option / slug rule / fixture, release.
- `README.md` — consumer-facing API and CLI. `MIGRATION.md` — sibling-repo migration tables.
