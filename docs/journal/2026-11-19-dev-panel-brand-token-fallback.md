# Studio V18: brand-token packaging in manual DEV fallback

- **Date:** 2026-11-19
- **Agent:** Codex
- **PR:** #1730 (draft, targets `ops/github-mydevil-source-fallback-20261113`)
- **Application candidate:** #1729, SHA `6693f282a30d124076ed9da94bab167535d5a467`
- **Live DEV before any activation:** `b72632e117e3355410f1945f1aea7cffd4d76734` (owner's read-only SSH preflight)

## Finding

The previous manual panel packager only transforms `@salonbw/api: workspace:*` into a local `file:` dependency. The V18 candidate adds `@salonbw/brand-tokens: workspace:*` in `apps/panel/package.json`. The resulting archive retains an unsupported workspace protocol when `npm22` installs outside the pnpm monorepo on FreeBSD. This blocks safe staging before activation.

## Change

- Bundle brand-token package.json, CSS sources and font assets with the panel archive, without copying Mac node_modules or private configuration.
- Add a small, fail-closed dependency rewriting helper covering API and brand tokens, with explicit bundled package manifest validation.
- Keep older candidates without brand-token dependency supported.
- Run the helper's behavioral regressions from `scripts/ci/manual-dev-panel-packaging.test.sh`.

## Validation

- RED (against the previous API-only conversion): 3 behavioral tests failed for unresolved brand dependency, missing brand package, and unknown workspace dependency; the historical compatibility test passed.
- GREEN (new converter): 4/4 Node tests PASS.
- `node --check` on converter and tests PASS.
- `bash -n` on the patched packager and offline QA launcher PASS.
- The files used for these checks were fetched back from PR #1730's GitHub branch; no MyDevil release was activated.

## Blocked / not claimed

- No full Mac packaging suite, Gitleaks, FreeBSD npm22 install, isolated stage smoke, Passenger activation, GitHub Actions run, or live DEV UAT for #1730.
- Owner-supplied SSH preflight shows 26.5 GiB free account quota, sufficient host filesystem free space, and correct DEV domain symlink. This read-only preflight is not an activation receipt.
- Production, database, dev server files, snapshots and persistent runtime state remain untouched.

## Next

On the owner's Mac: run the exact-branch fallback packaging suite and produce a SHA-pinned candidate archive. Recheck source receipt, quota, staged runtime, startup/entrypoint and recovery guards before a separately observed DEV activation. Verify release SHA, Basic Auth, static assets and four V18 calendar behaviors after activation.
