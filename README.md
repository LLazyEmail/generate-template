# @llazyemail/generate-template

Engine for turning **your** named email templates into HTML.
This package does not ship templates. You pass a catalog and render functions.

Requires **Node.js >= 20**. Disk writes go through [`markup-generator`](https://github.com/LLazyEmail/markup-generator).

Current version: **1.0.1**. Published on [npmjs](https://www.npmjs.com/package/@llazyemail/generate-template).

```bash
npm install @llazyemail/generate-template
```

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

The CLI is an adapter over `run()`. Drive it from your project — it is not a package export.

```ts
import { createGenerator } from '@llazyemail/generate-template';
// bin: generate-template --template=welcome --out=generated/welcome.html
```

## Scripts

```bash
npm test
npm run typecheck
npm run build
```
