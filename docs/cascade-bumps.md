# Cascade dependency bumps

After `@llazyemail/generate-template` is published to GitHub Packages you can open update pull requests in the other LLazyEmail repositories with one workflow.

> **Status (November 2026): not wired.** The `CASCADE_TOKEN` secret does not exist in this repository or at the LLazyEmail organization level, the workflow has never run, and neither `changesets.yml` nor `npm-publish.yml` calls it. A maintainer has to create the token (see [Required secret](#required-secret)); it cannot be faked or replaced by `GITHUB_TOKEN`. Until then the workflow fails fast in the **Resolve target repos** job with `CASCADE_TOKEN is not set`, and consumers get updates from their own Renovate or Dependabot. The sibling repo email-template-workflows removed its cascade for that reason in [#53](https://github.com/LLazyEmail/email-template-workflows/pull/53); removing this one is a reasonable alternative to adding the token.

## How to run

1. Go to **Actions → Cascade dependency bumps → Run workflow**.
2. Enter the version that was just published (the `version` in `package.json`, e.g. `1.9.1`).
3. Leave `repos` empty to use the default list, or override it.
4. Check `dry_run` first if you want to preview the changes.

Default targets:

- `LLazyEmail/postmark-transactional-template-simple` (exact pin)
- `LLazyEmail/_playing_with_lit` (caret range)

The workflow preserves the existing range style (`^`, `~`, or exact) unless you uncheck `preserve_range`.

## Required secret

Add an organization or repository secret named **`CASCADE_TOKEN`**:

- Fine-grained personal access token **or** a GitHub App installation token.
- Permissions needed on every consumer repository:
  - Contents: Read and write
  - Pull requests: Read and write
- (Recommended) Restrict the token to only the repositories that should receive bumps.

The default `GITHUB_TOKEN` cannot create branches or pull requests in other repositories, so the separate token is required.

## What the workflow does

For each target repository it:

1. Checks out `main`.
2. Reads the current version of `@llazyemail/generate-template` in `package.json`.
3. Writes the new version (preserving range prefix when requested).
4. Updates `package-lock.json` when one exists (`npm install --package-lock-only`).
5. Opens a pull request on branch `chore/bump-generate-template-<version>`.

PRs are labeled `dependencies` and contain a short summary of the change.

## Calling it from another workflow

You can also call it after a successful publish:

```yaml
jobs:
  cascade:
    needs: publish
    if: success()
    uses: ./.github/workflows/cascade-bumps.yml
    with:
      version: ${{ needs.publish.outputs.version }}   # or hard-code / parse from tag
    secrets:
      CASCADE_TOKEN: ${{ secrets.CASCADE_TOKEN }}
```

(The publish workflow would need to expose the version as an output, or you can pass the tag name.)

## Adding a new consumer

1. Make sure the repository has a `package.json` that depends on `@llazyemail/generate-template`.
2. Add it to the default list inside `.github/workflows/cascade-bumps.yml` (the `matrix.json` fallback) **or** just pass it in the `repos` input when you run the workflow.
3. Ensure `CASCADE_TOKEN` has write access to that repository.

## Safety notes

- The workflow is `workflow_dispatch` / `workflow_call` only — it never runs automatically on push or release.
- Use `dry_run` first.
- Exact pins (like Postmark’s `1.6.1`) become the new exact version; caret ranges stay caret.
- Review the opened PRs and their CI before merging. Some consumers may need additional changes if the new version has breaking API adjustments.

---

See also: [organization schema](organization-schema.md), [AGENTS.md](../AGENTS.md).
