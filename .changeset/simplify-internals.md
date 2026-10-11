---
'@llazyemail/generate-template': patch
---

Simplify internals with no API change: serialize dates with a `JSON.stringify` replacer, share one `errorMessage` helper, reuse `wantsAll` in `requestsFromArgs`, and have `write`/`run` share one persist path. The file-template renderer now passes the payload over stdin instead of writing two temp files.
