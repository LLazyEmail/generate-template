# Sandbox

Live proof that `@llazyemail/generate-template` renders real templates and writes HTML.

```bash
npm test
npm run sandbox
```

`npm run sandbox` uses `createGenerator` + `run()` against the six templates in `templates/`, writes HTML plus `index.html` and `rendered.txt` to `sandbox/generated/`, and fails if a render or write does not happen.

This directory is not published. `package.json` `files` is an allowlist (`dist`, `README.md`, `LICENSE`), and `.npmignore` also excludes `sandbox/`.

Catalog entries inject `render` functions (the supported path). They do not use `file` + `exportName`.

Open any file under `sandbox/generated/` in a browser after the script succeeds.
