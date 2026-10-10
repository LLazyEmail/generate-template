# @llazyemail/generate-template

## 1.6.1

### Patch Changes

- Keep `generate-template` and `generate-template-assert` in the published package. npm was dropping the bin entries.

## 1.6.0

### Minor Changes

- 8ca0801: Require Node.js >= 22.18, render once when `run({ write })` is set, add `--help`, fail bad configs at load time, and replace sandbox fixtures with package-owned templates.

## 1.5.1

### Patch Changes

- Sandbox writes `index.html` and `rendered.txt`. The published tarball excludes `sandbox/`, `src/`, and `tests/`.
