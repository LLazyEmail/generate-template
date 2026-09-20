# generate-template

Small engine for turning named email templates into HTML.

The original script assumed `src/templates` inside one app. This package does not. You pass a catalog, payloads, and either a `render` function or a file on *your* disk.

Requires **Node.js >= 20**.

## Install

```bash
npm install generate-template
```

## Library

Bind templates from the consuming project:

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

Point at another repo's files (the old layout):

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

`CATALOG` and `SAMPLE_PAYLOADS` are the default registry copied from the source project. They are optional examples, not required to use the module.

## CLI

```bash
npx generate-template --list
npx generate-template --template=welcome --out=generated/welcome.html
npx generate-template --all --out=generated
```

The CLI uses `createGenerator()` with `process.cwd()`.

## Publish

A GitHub Release on `main` runs `.github/workflows/npm-publish.yml` (`npm publish --access public --provenance`).
