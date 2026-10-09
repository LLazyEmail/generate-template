# @llazyemail/generate-template

Engine for turning **your** named email templates into HTML.
This package does not ship templates. You pass a catalog and render functions.

Requires **Node.js >= 20**. Disk writes go through [`markup-generator`](https://github.com/LLazyEmail/markup-generator).

Current version: **1.5.1**. Published on [GitHub Packages](https://github.com/LLazyEmail/generate-template/pkgs/npm/generate-template).

`1.0.1` is the release Postmark depends on. `0.2.0` was an unpublished markup-generator branch, not a release.

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

The bin loads a project catalog. It does not ship one.

```js
// generate-template.config.js
export { createProjectGenerator } from './scripts/create-project-generator.js';
```

Or set `package.json` `"generateTemplate": "./scripts/create-project-generator.js"`. That module must export `createProjectGenerator()`, `generator`, or a default function returning a generator. `--config=` overrides the search.

```bash
generate-template --list
generate-template --template=welcome --data=src/data/welcome.data.js --out=generated/welcome.html
generate-template --all --out=generated
generate-template assert --slugs-file=tests/fixtures/generated-slugs.json --out=generated
```

`--all` (also the default when `--template` is omitted) calls `writeAll(outDir)`. A single `--template` calls `run()`, so `--data=` still loads through the same `createGenerator` factory as the library. `generate-template-assert` is the assert command without the `assert` subcommand.

Passing a generator to `main(argv, generator)` still skips the config file. That is what a project script can do. The bin itself always calls `main()` — it does not compare `argv[1]` to its own file, so an npm `.bin` symlink still runs.

## Sandbox

`sandbox/` is a local proof, not part of the package. It renders six simple HTML templates through `createGenerator` + `run()` and writes `sandbox/generated/`.

```bash
npm run sandbox
```

Open `sandbox/generated/index.html` after it succeeds. `package.json` `files` and `.npmignore` keep `sandbox/`, `src/`, and `tests/` out of the published tarball.

## Scripts

```bash
npm test
npm run typecheck
npm run build
```
