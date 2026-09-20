# generate-template

Small engine for turning named email templates into HTML.

Requires **Node.js >= 20**.

## Why this package is structured this way

The generator started as a script cut out of another project. That script assumed it still lived inside that app:

- paths were relative to this package, not the consumer
- catalog entries were hardcoded file names from the other repo
- `renderOne` always spawned Node to import those files
- importing the module assumed a local CLI project layout (`src/templates`, `src/data`, package-relative `ROOT`)

An npm package cannot look next to itself for `src/templates` and `src/data`. Those files belong to the consuming project, or they are passed in as functions.

`createGenerator(config)` is the public API. The consumer supplies the catalog and how to render.

Render order:

1. an injected `render` function (or an object with `{ render() }`)
2. an optional file on the consumer’s disk

`CATALOG` and `SAMPLE_PAYLOADS` are only a default registry copied from the source project. They are not required to use the module.

## Install

```bash
npm install generate-template
```

## Library

Bind templates from the consuming project. No files inside this package are required:

```ts
import { createGenerator } from 'generate-template';
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
import { createGenerator, CATALOG, SAMPLE_PAYLOADS } from 'generate-template';

const generate = createGenerator({
  root: process.cwd(),
  templatesDir: 'src/templates',
  dataDir: 'src/data',
  catalog: CATALOG,
  samplePayloads: SAMPLE_PAYLOADS,
});
```

`root` / `templatesDir` / `dataDir` resolve against the consuming project, not against `node_modules/generate-template`.

## CLI

```bash
npx generate-template --list
npx generate-template --template=welcome --out=generated/welcome.html
npx generate-template --all --out=generated
```

The CLI uses `createGenerator()` with `process.cwd()`.

## Scripts

```bash
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup (CJS + ESM + types + CLI)
```

## Publish

CI runs typecheck, build, and tests on push and pull requests to `main`.

A GitHub Release on `main` runs `.github/workflows/npm-publish.yml` (`npm publish --access public --provenance`). Use workflow_dispatch with `dry_run` to pack without publishing.

Configure npm Trusted Publishing for this GitHub repo, or set `NODE_AUTH_TOKEN` as a repository secret if you publish with a classic token.
