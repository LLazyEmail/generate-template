# Migrating sibling repos to createGenerator + run()

No other LLazyEmail repo currently imports `@llazyemail/generate-template`.
When one does, use this surface only.

## Stop importing

```ts
import { parseArgs, main, generateTemplate, findEntry, loadPayload } from '@llazyemail/generate-template';
```

Those exports were removed.

## Use this instead

```ts
import {
  createGenerator,
  GenerateTemplateError,
  type GenerateRequest,
} from '@llazyemail/generate-template';
import { WelcomeEmail } from './emails/welcome';

const generate = createGenerator({
  catalog: [{ ids: ['welcome', 'WelcomeEmail'], render: WelcomeEmail }],
  samplePayloads: { welcome: { name: 'Alex' } },
});

const html = await generate.render('welcome');
const result = await generate.run({ templateId: 'welcome', payload: { name: 'Alex' } });
```

| Old | New |
|---|---|
| `parseArgs` + `main` | your script calls `generate.run(request)` |
| `generateTemplate({ title })` | gone — that was a toy HTML wrapper |
| `findEntry(catalog, id)` | `generate.find(id)` |
| `loadPayload(id)` | `await generate.loadPayload(id)` or pass `payload` on `run` |
| `{ file, exportName }` | inject `render`, or set `allowFileTemplates: true` |
| `generate.render()` sync | `await generate.render()` |

Prove it locally with `npm run sandbox` in this repo.
