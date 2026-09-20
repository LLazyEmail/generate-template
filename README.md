# generate-template

TypeScript helper and CLI for generating email templates.

Requires **Node.js >= 20**.

## Install

```bash
npm install generate-template
```

## Library

```ts
import {
  generateTemplate,
  CATALOG,
  loadPayload,
  findEntry,
} from 'generate-template';

const html = generateTemplate({
  title: 'Weekly Digest',
  body: '<p>Hello</p>',
});

const entry = findEntry('welcome');
const payload = loadPayload('WelcomeEmail');
```

## CLI

```bash
npx generate-template --list
npx generate-template --template=welcome --out=generated/welcome.html
npx generate-template --all --out=generated
```

Catalog IDs live in `src/template-catalog.ts`. Rendering a catalog template still needs the matching file under `src/templates`.

## Scripts

```bash
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup (CJS + ESM + types + CLI)
```

## Publish

CI runs typecheck, build, and tests on push and pull requests to `main`.

Creating a GitHub Release on `main` runs `.github/workflows/npm-publish.yml`, which publishes to npm with provenance. Use workflow_dispatch with `dry_run` to pack without publishing.

Configure npm Trusted Publishing for this GitHub repo, or set `NODE_AUTH_TOKEN` as a repository secret if you publish with a classic token.
