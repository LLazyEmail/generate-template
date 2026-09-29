# @llazyemail/generate-template

Engine for turning **your** named email templates into HTML.
This package does not ship templates. You pass a catalog and render functions.

Requires **Node.js >= 20**. Disk writes go through [`markup-generator`](https://github.com/LLazyEmail/markup-generator).

Current version: **0.2.0**. Hosted on GitHub Packages only (not npmjs).

## Install

```ini
# .npmrc in the consuming project
@llazyemail:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @llazyemail/generate-template
```

Until you publish `0.2.0` to GitHub Packages, depend on git:

```bash
npm install github:LLazyEmail/generate-template#main
```

## Use it from another project

```ts
import { createGenerator, GenerateTemplateError } from '@llazyemail/generate-template';
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
  outDir: 'generated',
});

const html = generate.render('welcome');
const file = await generate.write('welcome');

// Low-level contract (future HTTP/API seam)
const result = await generate.run({
  templateId: 'welcome',
  payload: { name: 'Alex' },
});
// result.html — no disk write unless write: true | { out }
```

Failures are `GenerateTemplateError` with a `code`:
`UNKNOWN_TEMPLATE` | `NO_PAYLOAD` | `RENDER_FAILED` | `WRITE_FAILED` | `INVALID_CONFIG`.

`write()` and `writeAll()` are async. They call `writeGeneratedFile` / `writeGeneratedEmail` from `markup-generator`. Pass `{ uniqueName: true }` if you want `{slug}-{uuid}.html`.

Same helpers are re-exported if you need them directly:

```ts
import {
  writeGeneratedFile,
  writeGeneratedEmail,
  generateFileName,
  MarkupGeneratorError,
} from '@llazyemail/generate-template';
```

File-based catalog entries (`file` + `exportName`) still work, but they spawn a child Node process. Prefer an injected `render` function in other apps.

## CLI

The CLI has no built-in catalog. Drive it from your project:

```ts
import { main, createGenerator } from '@llazyemail/generate-template';
import { catalog, samplePayloads } from './emails/catalog';

await main(process.argv.slice(2), createGenerator({ catalog, samplePayloads }));
```

```bash
node ./scripts/generate.mjs --list
node ./scripts/generate.mjs --template=welcome --out=generated/welcome.html
node ./scripts/generate.mjs --all --out=generated
```

## Scripts

```bash
npm test
npm run typecheck
npm run build
```

Examples live in `sandbox/`.
