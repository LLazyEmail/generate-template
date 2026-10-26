## Release

Full flow: [`docs/changesets.md`](changesets.md).

1. Add a changeset — either `npx changeset` locally, or **Actions → Add changeset** (bump + summary; it opens a PR with the `.changeset/*.md` file).
2. Merge to main; the changesets action opens a "Version packages" PR that bumps `package.json`, the lockfile, and `CHANGELOG.md`.
3. Merging that PR creates a GitHub Release, which triggers `npm-publish.yml` (full gate → `npm publish`).

Never edit `package.json` `version` or `CHANGELOG.md` by hand, and never create a GitHub Release before the Version Packages PR is merged.

## Migrate a sibling repo off local scripts

Follow `MIGRATION.md` (old script → package equivalents). Prove it with the sandbox pattern: `npm run sandbox` in this repo, then `generate-template --list` in the consumer.
