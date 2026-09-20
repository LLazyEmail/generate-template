# @llazyemail/generate-template

Standalone engine for turning named email templates into HTML.
Published to **GitHub Packages** as `@llazyemail/generate-template`.

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

## Install from GitHub Packages

GitHub Packages is a scoped registry. Add this to the consuming project `.npmrc` (see `.npmrc.example`):

```ini
@llazyemail:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` must be a GitHub PAT with `read:packages` (and SSO authorized for the `LLazyEmail` org if required). Then:

```bash
npm install @llazyemail/generate-template
```

## Library

Bind templates from the consuming project. No files inside this package are required:

```ts
import { createGenerator } from '@llazyemail/generate-template';
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
import { createGenerator, CATALOG, SAMPLE_PAYLOADS } from '@llazyemail/generate-template';

const generate = createGenerator({
  root: process.cwd(),
  templatesDir: 'src/templates',
  dataDir: 'src/data',
  catalog: CATALOG,
  samplePayloads: SAMPLE_PAYLOADS,
});
```

`root` / `templatesDir` / `dataDir` resolve against the consuming project, not against `node_modules/@llazyemail/generate-template`.

## CLI

```bash
npx @llazyemail/generate-template --list
npx @llazyemail/generate-template --template=welcome --out=generated/welcome.html
npx @llazyemail/generate-template --all --out=generated
```

The CLI uses `createGenerator()` with `process.cwd()`.

## Scripts

```bash
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup (CJS + ESM + types + CLI)
```

## Publish (maintainers)

1. Bump `version` in `package.json`.
2. Create a GitHub Release on `main` (tag `v0.1.0`, etc.).
3. `.github/workflows/npm-publish.yml` builds, tests, and runs `npm publish` against `https://npm.pkg.github.com` using `GITHUB_TOKEN`.

Use **Actions → Publish to GitHub Packages → Run workflow** with `dry_run` to pack without publishing.

The package name **must** stay scoped as `@llazyemail/...` — GitHub Packages only accepts names that match the owner.

After the first successful publish, the package appears under the repo **Packages** tab:
https://github.com/LLazyEmail/generate-template/pkgs/npm/generate-template
