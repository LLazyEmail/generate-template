# @llazyemail/generate-template

## 1.9.0

### Minor Changes

- d7e595f: publishing the 1.8.* version

## 1.7.1

### Patch Changes

- 593d9d4: Simplify internals with no API change: serialize dates with a `JSON.stringify` replacer, share one `errorMessage` helper, reuse `wantsAll` in `requestsFromArgs`, and have `write`/`run` share one persist path. The file-template renderer now passes the payload over stdin instead of writing two temp files.

## 1.7.0

### Minor Changes

- bfbe83a: Type config-loading failures as `GenerateTemplateError` and add `CONFIG_NOT_FOUND`, `CONFIG_IMPORT_FAILED`, and `CONFIG_INVALID` codes.

## 1.6.1

### Patch Changes

- Keep `generate-template` and `generate-template-assert` in the published package. npm was dropping the bin entries.

## 1.6.0

### Minor Changes

- 8ca0801: Require Node.js >= 22.18, render once when `run({ write })` is set, add `--help`, fail bad configs at load time, and replace sandbox fixtures with package-owned templates.

## 1.5.1

### Patch Changes

- Sandbox writes `index.html` and `rendered.txt`. The published tarball excludes `sandbox/`, `src/`, and `tests/`.
