# Migrating sibling repos to createGenerator + run()

Sibling repos should not keep their own generate/assert scripts. Import the adapters from this package.

## Generate CLI

Replace `scripts/generate-template.ts` with a project generator plus `main()`:

```ts
import { main } from '@llazyemail/generate-template';
import { createProjectGenerator } from './create-project-generator';

main(process.argv.slice(2), createProjectGenerator()).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
```

`main` accepts `--list`, `--all`, `--template=`, `--data=`, and `--out=`. `--all`, a missing `--template`, or `--template=all` writes every catalog entry. `parseArgs` and `requestsFromArgs` are exported for tests.

## Assert generated HTML

Replace `scripts/assert-generated.ts`. Pass the project's slug list; do not import a fixture from this package.

```ts
import { runAssertGenerated } from '@llazyemail/generate-template';
import slugs from '../tests/fixtures/generated-slugs.json' with { type: 'json' };

runAssertGenerated({ slugs, argv: process.argv.slice(2) });
```

Or drop the script and call the bin:

```bash
generate-template-assert --slugs-file=tests/fixtures/generated-slugs.json --out=generated
```

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
| `scripts/generate-template.ts` | `main(argv, createProjectGenerator())` |
| `scripts/assert-generated.ts` | `runAssertGenerated({ slugs, argv })` |
| `generateTemplate({ title })` | gone — that was a toy HTML wrapper |
| `findEntry(catalog, id)` | `generate.find(id)` |
| `loadPayload(id)` | `await generate.loadPayload(id)` or pass `payload` on `run` |
| `{ file, exportName }` | inject `render`, or set `allowFileTemplates: true` |

Prove it locally with `npm run sandbox` in this repo.
