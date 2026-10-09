# Changesets

Add a changeset for every user-facing change:

```bash
npx changeset
```

On push to `main`, the Changesets workflow opens or updates a Version Packages pull request. Merging that PR bumps `package.json` and `CHANGELOG.md`. Publishing still happens when a GitHub Release is published.
