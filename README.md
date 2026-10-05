# @llazyemail/generate-template

Engine for turning **your** named email templates into HTML.
This package does not ship templates. You pass a catalog and render functions.

Requires **Node.js >= 20**. Disk writes go through [`markup-generator`](https://github.com/LLazyEmail/markup-generator).

Current version: **1.1.0**. Published on [GitHub Packages](https://github.com/LLazyEmail/generate-template/pkgs/npm/generate-template).

```bash
npm install @llazyemail/generate-template
```

Installs need a `read:packages` token. See `.npmrc.example`.

## Public API

```ts
import {
  createGenerator,
  GenerateTemplateError,
  type GenerateRequest,
  type GenerateResult,
} from '@llazyemail/generate-template';

const generate = createGenerator({
  catalog: [{ ids: ['welcome'], render: (p) => `<p>${(p as { name: string }).name}</p>` }],
  samplePayloads: { welcome: { name: 'Alex' } },
});

const html = await generate.render('welcome');
const result = await generate.run({ templateId: 'welcome', payload: { name: 'Alex' } });
```

`run(request)` is the contract a future HTTP handler wraps. Failures are `GenerateTemplateError` with `code`:
`UNKNOWN_TEMPLATE` | `NO_PAYLOAD` | `RENDER_FAILED` | `WRITE_FAILED` | `INVALID_CONFIG`.

`render` / `loadPayload` are async. File catalog entries need `allowFileTemplates: true` (prefer injected `render`).

Date revival is off unless `reviveDates: true`.

## CLI

Project scripts should call the exported adapter with their own generator. Flags match the postmark script: `--list` `--all` `--template=` `--data=` `--out=`.

```ts
import { main } from '@llazyemail/generate-template';
import { createProjectGenerator } from './create-project-generator';

main(process.argv.slice(2), createProjectGenerator()).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
```

The `generate-template` bin is the same adapter with an empty catalog. It errors until a project passes `createGenerator({ catalog })`.

## Assert generated HTML

Port of `scripts/assert-generated.ts`. Slugs stay in the project; the check does not.

```ts
import { runAssertGenerated, slugsFromGenerator } from '@llazyemail/generate-template';
import slugs from './tests/fixtures/generated-slugs.json' with { type: 'json' };

runAssertGenerated({ slugs, argv: process.argv.slice(2) });
// or: runAssertGenerated({ slugs: slugsFromGenerator(generate) });
```

`assertGenerated({ slugs, outDir })` returns `{ ok, missing, invalid }` and does not exit. A file counts only if it exists and its contents include `<html` or `<!doctype`.

Bin form, when the slug list is on disk:

```bash
generate-template-assert --slugs-file=tests/fixtures/generated-slugs.json --out=generated
```

## Scripts

```bash
npm test
npm run typecheck
npm run build
```
