# Cascade dependency bumps

After `@llazyemail/generate-template` is published to GitHub Packages you can open update pull requests in the other LLazyEmail repositories with one workflow.

## How to run

1. Go to **Actions → Cascade dependency bumps → Run workflow**.
2. Enter the version that was just published (e.g. `1.7.1`).
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
