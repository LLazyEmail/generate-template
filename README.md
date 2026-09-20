# generate-template

TypeScript helper for generating email templates.

Requires **Node.js >= 20**.

## Install

```bash
npm install generate-template
```

## Usage

```ts
import { generateTemplate } from 'generate-template';

const html = generateTemplate({
  title: 'Weekly Digest',
  body: '<p>Hello</p>',
});
```

## Scripts

```bash
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup (CJS + ESM + types)
```

CI runs typecheck, build, and tests on push and pull requests to `main`.
