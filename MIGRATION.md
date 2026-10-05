# Migrating sibling repos to createGenerator + run()

Sibling repos should not keep their own generate/assert scripts.

## Versions

`0.2.0` was an unpublished branch while writes moved to markup-generator. It is not a release. `1.0.1` is the version Postmark depends on. `1.2.0` is the CLI fix: config loader, bin without a symlink check, `assert` command, and `--all` via `writeAll()`.

## Generate CLI

The bin loads a catalog. Export `createProjectGenerator` from `generate-template.config.js`, or set `package.json` `"generateTemplate"` to that module. `--config=` overrides the search.

```bash
generate-template --list
generate-template --all --out=generated
generate-template --template=welcome --data=src/data/welcome.data.js
```

`--all`, a missing `--template`, or `--template=all` calls `generator.writeAll(outDir)`. That writes `{slug}.html` for each catalog entry's first id, same files as the old Postmark script. A single template still uses `run()`, so `--data=` goes through `loadPayloadFromFiles`.

`main(argv, generator)` still accepts an injected generator and skips the config file.

## Assert generated HTML

```bash
generate-template assert --slugs-file=tests/fixtures/generated-slugs.json --out=generated
generate-template-assert --slugs=welcome,invoice --out=generated
```

With a loaded catalog and no slug flag, `assert` uses `slugsFromGenerator`. A file counts only if it exists and includes `<html` or `<!doctype`.

## Engine contract

```ts
import {
  createGenerator,
  GenerateTemplateError,
  type GenerateRequest,
} from '@llazyemail/generate-template';

const generate = createGenerator({
  catalog: [{ ids: ['welcome', 'WelcomeEmail'], render: WelcomeEmail }],
  samplePayloads: { welcome: { name: 'Alex' } },
});

const html = await generate.render('welcome');
const result = await generate.run({ templateId: 'welcome', payload: { name: 'Alex' } });
```

| Old local script | Package |
|---|---|
| `scripts/generate-template.ts` | `generate-template` bin, or `main(argv, createProjectGenerator())` |
| `scripts/assert-generated.ts` | `generate-template assert` |
| `generate.writeAll(out)` | `main` `--all` calls `writeAll` |
| `generateTemplate({ title })` | gone — that was a toy HTML wrapper |
| `findEntry(catalog, id)` | `generate.find(id)` |
| `loadPayload(id)` | `await generate.loadPayload(id)` or pass `payload` on `run` |
| `{ file, exportName }` | inject `render`, or set `allowFileTemplates: true` |


```ts
import {
  createGenerator,
  GenerateTemplateError,
  type GenerateRequest,
} from '@llazyemail/generate-template';

const generate = createGenerator({
  catalog: [{ ids: ['welcome', 'WelcomeEmail'], render: WelcomeEmail }],
  samplePayloads: { welcome: { name: 'Alex' } },
});

const html = await generate.render('welcome');
const result = await generate.run({ templateId: 'welcome', payload: { name: 'Alex' } });
```

| Old local script | Package |
|---|---|
| `scripts/generate-template.ts` | `main(argv, createProjectGenerator())` |
| `scripts/assert-generated.ts` | `runAssertGenerated({ slugs, argv })` |
| `generateTemplate({ title })` | gone — that was a toy HTML wrapper |
| `findEntry(catalog, id)` | `generate.find(id)` |
| `loadPayload(id)` | `await generate.loadPayload(id)` or pass `payload` on `run` |
| `{ file, exportName }` | inject `render`, or set `allowFileTemplates: true` |

Prove it locally with `npm run sandbox` in this repo.
