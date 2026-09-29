# @llazyemail/generate-template

Engine for turning **your** named email templates into HTML.
This package does not ship templates. You pass a catalog and render functions.

Requires **Node.js >= 20**. Disk writes go through [`markup-generator`](https://github.com/LLazyEmail/markup-generator).

Current version: **0.2.0**. Hosted on GitHub Packages only (not npmjs).

## Install

```ini
@llazyemail:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @llazyemail/generate-template
# or until Packages is published:
npm install github:LLazyEmail/generate-template#main
```

## Use it from another project

Preferred: inject a `render` function. That is the core path.

```ts
import { createGenerator, GenerateTemplateError } from '@llazyemail/generate-template';
import { WelcomeEmail } from './emails/welcome';

const generate = createGenerator({
  catalog: [{ ids: ['welcome', 'WelcomeEmail'], render: WelcomeEmail }],
  samplePayloads: { welcome: { name: 'Alex' } },
  outDir: 'generated',
});

const html = generate.render('welcome');
const file = await generate.write('welcome');
const result = await generate.run({ templateId: 'welcome', payload: { name: 'Alex' } });
```

Failures are `GenerateTemplateError` with `code`:
`UNKNOWN_TEMPLATE` | `NO_PAYLOAD` | `RENDER_FAILED` | `WRITE_FAILED` | `INVALID_CONFIG`.

### Breaking: file catalog entries

`{ file, exportName }` no longer renders unless you opt in. Child-process spawn is an adapter, not core.

```ts
const generate = createGenerator({
  catalog: [{ ids: ['welcome'], file: 'welcomeEmail.ts', exportName: 'WelcomeEmail' }],
  templatesDir: 'src/templates',
  allowFileTemplates: true,
});
```

Without that flag you get `RENDER_FAILED`. Fix sibling repos by injecting `render` (preferred) or setting `allowFileTemplates: true`.

## CLI

```ts
import { main, createGenerator } from '@llazyemail/generate-template';
import { catalog, samplePayloads } from './emails/catalog';

await main(process.argv.slice(2), createGenerator({ catalog, samplePayloads }));
```

## Scripts

```bash
npm test
npm run typecheck
npm run build
```
