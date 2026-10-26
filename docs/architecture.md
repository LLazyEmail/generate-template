# Architecture

Internal reference. Read the section your task needs — do not read this file end-to-end by default. Contracts checklist: `AGENTS.md`.

## Request flow

```
src/bin.ts / src/bin-assert.ts            consumer code
        |                                       |
        v                                       v
src/cli.ts  main(argv, generator?)      createGenerator(config)   <- src/create-generator.ts (only factory)
        |                                       |
        |  config discovery (src/config/):    |  wires adapters:
        |   --config= -> package.json           |   loadFromFiles <- src/adapters/payload-files.ts  (always)
        |   "generateTemplate" -> config.*      |   fileRenderer  <- src/adapters/file-renderer.ts (only allowFileTemplates)
        v                                       v
                    TemplateGenerator (src/engine/generator.ts)
        find/slug/ids -> Catalog (src/catalog)
        loadPayload   -> PayloadSource (src/engine/payload.ts)
        render        -> renderEntry (src/engine/render.ts) -> invokeRenderer (src/engine/in-process.ts) or fileRenderer
        write/writeAll/run -> Writer (src/persist/writer.ts) -> markup-generator -> disk
```

## Module notes

| Module                          | Key exports                                                                                                                                        | Notes                                                                                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/index.ts`                  | `createGenerator`, `TemplateGenerator`, `DEFAULT_OUT_DIR`, errors, all public types, config/CLI/assert helpers, re-exports from `markup-generator` | Anything reachable here is package API                                                                                                                                                                                               |
| `src/create-generator.ts`       | `createGenerator`                                                                                                                                  | Merges config; defaults `loadFromFiles` to the payload-files adapter and `fileRenderer` to the spawn adapter when `allowFileTemplates`                                                                                               |
| `src/engine/generator.ts`       | `TemplateGenerator`, `createEngine`                                                                                                                | Constructor normalizes config: `root` resolves against cwd, `templatesDir`/`dataDir` against `root` (empty string when absent), defaults `outDir: 'generated'`, `skipFiles: index.js index2.js registry.ts registry.js`              |
| `src/engine/render.ts`          | `renderEntry`                                                                                                                                      | Catalog lookup, date revival gate, renderer precedence                                                                                                                                                                               |
| `src/engine/in-process.ts`      | `invokeRenderer`, `renderInProcess`                                                                                                                | Accepts `(payload) => html` or `{ render }`; non-string result is `RENDER_FAILED`                                                                                                                                                    |
| `src/engine/payload.ts`         | `loadPayload`, `PayloadSource`, `reviveDates`, `serializePayload`                                                                                  | Resolution order below; `{ "__date": iso }` marker for JSON safety                                                                                                                                                                   |
| `src/engine/errors.ts`          | `GenerateTemplateError`, `isGenerateTemplateError`, `GenerateTemplateErrorCode`                                                                    | Carries `code` + optional `templateId`                                                                                                                                                                                               |
| `src/catalog/resolve.ts`        | `findEntry`, `slugFromId`, `availableIds`                                                                                                          | Case-insensitive compare of every `ids` entry; `INVALID_CONFIG` when `catalog` is not an array                                                                                                                                       |
| `src/persist/writer.ts`         | `Writer`, `wrapWriteError`                                                                                                                         | `writeFile` for explicit paths, `writeNamed` for slug/out logic; wraps every failure into `WRITE_FAILED`                                                                                                                             |
| `src/adapters/file-renderer.ts` | `renderFromFile`                                                                                                                                   | Spawn path, see below                                                                                                                                                                                                                |
| `src/adapters/payload-files.ts` | `loadPayloadFromFiles`                                                                                                                             | `dataPath` via `loadData`; otherwise probes `{templateId}.data.js` then `{slug}.data.js` in `dataDir`                                                                                                                                |
| `src/adapters/list-files.ts`    | `listTemplateFiles`                                                                                                                                | CLI-only directory scan through `markup-generator`                                                                                                                                                                                   |
| `src/cli.ts`                    | `parseArgs`, `requestsFromArgs`, `main`, `wantsAll`, `USAGE`                                                                                       | `--key=value` regex only; `assert` dispatched before flag parsing                                                                                                                                                                    |
| `src/config/`                   | `CONFIG_CANDIDATES`, `findConfigPath`, `generatorFromModule`, `loadProjectGenerator`, `isTemplateGenerator`                                        | Module must export `createProjectGenerator()`, `generator`, or `default`; duck-check is `run` + `writeAll` functions + `catalog` array; partials: find-config.ts (discovery), module.ts (contract), load.ts (import + error shaping) |
| `src/assert-generated.ts`       | `assertGenerated`, `runAssertGenerated`, `formatAssertGenerated`, argv helpers                                                                     | Pure check + CLI adapter; sets `process.exitCode`, never exits                                                                                                                                                                       |

## Resolution orders

Payload — `loadPayload` in `src/engine/payload.ts`:

1. `dataPath` given → `loadFromFiles({ templateId, dataPath, ... })`; without an adapter → `NO_PAYLOAD`.
2. `samplePayloads[templateId]` truthy → returned. Keys are exact (case-sensitive) even though id lookup is not — alias keys when a template has several ids (see `sandbox/example-catalog.ts`).
3. `useDataFiles: true` → `loadFromFiles` probing `{dataDir}/{templateId}.data.js`, then `{dataDir}/{slug}.data.js`.
4. Otherwise → `NO_PAYLOAD` with a hint naming the expected `.data.js` path.

`config.loadPayload` replaces the whole chain (`PayloadSource.load`).

Render — `renderEntry` in `src/engine/render.ts`:

1. `findEntry` miss → `UNKNOWN_TEMPLATE`, message lists all available ids.
2. `reviveDates` (per request, else generator default) → deep date revival before the renderer sees the payload.
3. `entry.render` → in-process; non-string result → `RENDER_FAILED`.
4. `entry.file` → needs the injected file renderer (`allowFileTemplates: true`); missing file or spawn failure → `RENDER_FAILED`.
5. Neither → `RENDER_FAILED`.

Config — `findConfigPath` in `src/config/`:

1. `--config=` path (must exist, else error).
2. `package.json` `generateTemplate` string.
3. First existing `generate-template.config.{js,mjs,cjs,ts}`.

Importing a `.ts` config requires Node >= 22.18 (native type stripping); older runtimes get a `CONFIG_IMPORT_FAILED` error. A missing `--config=` file is `CONFIG_NOT_FOUND`; a module without a generator is `CONFIG_INVALID`.

## Error sites

| Code                   | Thrown in                                                                           | Trigger                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `INVALID_CONFIG`       | `src/catalog/resolve.ts`                                                            | `catalog` is not an array                                                                   |
| `UNKNOWN_TEMPLATE`     | `src/engine/render.ts`                                                              | id not found in catalog                                                                     |
| `NO_PAYLOAD`           | `src/engine/payload.ts`, `src/adapters/payload-files.ts`                            | no payload source, or `dataPath` file unreadable                                            |
| `RENDER_FAILED`        | `src/engine/render.ts`, `src/engine/in-process.ts`, `src/adapters/file-renderer.ts` | no renderer; file template without adapter; non-string renderer result; spawn failure       |
| `WRITE_FAILED`         | `src/persist/writer.ts`                                                             | any `markup-generator`/fs failure; `MarkupGeneratorError` code is prefixed into the message |
| `CONFIG_NOT_FOUND`     | `src/config/load.ts`                                                                | explicit `--config=` path does not exist                                                    |
| `CONFIG_IMPORT_FAILED` | `src/config/load.ts`                                                                | config module failed to import (syntax error; `.ts` on Node < 22.18)                        |
| `CONFIG_INVALID`       | `src/config/load.ts`, `src/config/module.ts`                                        | module loaded but does not export a generator                                               |

## CLI reference

`generate-template` (src/bin.ts → src/cli.ts):

| Flag            | Effect                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `--help` / `-h` | Print `USAGE`, exit 0                                                                                    |
| `--list`        | Print files in `templatesDir` plus catalog entries with source and `(missing)` marker; generates nothing |
| `--all`         | `writeAll(args.out \|\| outDir)`                                                                         |
| `--template=id` | Single `run()` with `write.out = args.out \|\| {outDir}/{slug}.html`                                     |
| `--data=path`   | Payload file; honored only on the single-template path                                                   |
| `--out=path`    | File when it has an extension, directory otherwise (`Writer.writeNamed`)                                 |
| `--config=path` | Explicit config; otherwise discovery order above                                                         |

- Only `--key=value` is parsed; a space-separated `--key value` is silently ignored (the value would be dropped).
- No `--template` with a loaded config behaves as `--all`. No args and no config → `USAGE` + exit 1. Loaded config with empty catalog → error + exit 1.
- `generate-template assert` (`runAssertCommand`) loads the config for default slugs; slug source order: `--slugs=a,b` → `--slugs-file=json` → catalog slugs. Without any of these → error + exit 1.
- `generate-template-assert` (src/bin-assert.ts) runs `runAssertGenerated` on raw argv — it does not load a config.
- A file counts as generated only when it exists and contains `<html` or `<!doctype` (case-insensitive).
- `--list` and the uncatalogued-files warning use `listTemplateFiles` honoring `skipFiles` (defaults: `index.js`, `index2.js`, `registry.ts`, `registry.js`).

## File templates (opt-in spawn)

With `allowFileTemplates: true`, a catalog `file` entry (optional `exportName`, default `default`) is rendered by `src/adapters/file-renderer.ts` in a child Node process: payload is serialized to a temp file with `{ "__date": iso }` markers, a generated script imports the module and runs it with `--experimental-strip-types`, and HTML comes back over stdout. Prefer injected `render`; use file templates only when the task requires rendering from disk.

## Writer, coverage, release

- `Writer.writeNamed`: `out` with an extension → that exact file; extensionless `out` → treated as a directory + `{slug}.html`; no `out` → `writeGeneratedEmail({ dir: outDir })`; `uniqueName: true` switches to `generateFileName(slug, 'html')`. A falsy result becomes `WRITE_FAILED`.
- `writeAll(outDir)`: one `write` per catalog entry using `entry.ids[0]`.
- Coverage gate (`vitest.config.ts`) applies to `src/engine/**` only (excl. `index.ts`, `types.ts`): 80% lines/functions/statements, 70% branches.
- Release: see [`docs/changesets.md`](changesets.md). Short form: add a `.changeset/*.md` (local or **Actions → Add changeset**) → merge to main → the changesets action opens a "Version packages" PR → merging it creates a GitHub Release → `.github/workflows/npm-publish.yml` reruns the full gate, `chmod +x` the bins, `npm publish` to GitHub Packages. `prepublishOnly` mirrors tests + build + chmod. The tarball is the `files` allowlist: `dist`, `README.md`, `LICENSE` — never `src/`, `tests/`, `sandbox/`. Never hand-edit `package.json` `version` or create a Release before the Version Packages PR is merged.
