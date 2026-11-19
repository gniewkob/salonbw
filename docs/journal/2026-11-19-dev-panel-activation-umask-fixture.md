# Deterministic public permission fixtures for manual DEV activation

- **Date:** 2026-11-19
- **Agent:** Codex
- **PR:** #1730 (tooling branch `fix/manual-dev-brand-tokens-20261119`)
- **Application candidate:** #1731, SHA `6dc96205ef4efa728314bff40be69f0858265d42`

## Finding

On the owner's Mac, Node 22 exact-SHA application tests (54/54) and panel
typecheck passed. The manual DEV packaging gate stopped before build/staging:
four of twelve `manual-dev-panel-activate.test.mjs` tests failed with
`public-runtime-permissions`. `fixture().app()` creates synthetic staged public
directories and receipt using the caller's inherited umask. The activation
guard correctly expects a stage root and public directories at `0755`, public
files at `0644`, and private configuration at `0600`.

## Change

After creating synthetic files, explicitly set the test app directory and its
`public` directory to `0755`, and `public/__release.json` to `0644`. The private
`.env.runtime.json` remains `0600`. The guard in
`scripts/mydevil/manual-dev-panel-activate.mjs` is not changed.

## Validation

- RED: unchanged tooling SHA `d26250abaa26f292b90b23ca83590d86b56c0b4d`
  with `umask 077` produced the same four failing activation tests.
- GREEN: patched activation suite **12/12 PASS** with `umask 077` and `022`
  on the isolated Linux checkout; negative permission tests still reject
  private staged roots and nested public assets.
- Full offline Linux packaging suite: **PARTIAL**. Activation tests pass, but
  the isolated Unix-socket child smoke exits early under this execution host
  at both `umask 077` and `022`. The owner's earlier Node 22 Mac run passed
  this Unix-socket smoke. A fresh full Mac run is required.

## Rollout

No application release, MyDevil staging, Passenger restart, DB or production
mutation occurred in the reported stopped run. CI on the new tooling SHA and
Mac exact-SHA fallback QA are not yet verified.

## Follow-up

Fetch the updated tooling branch to the owner Mac, run the full offline
packaging suite on Node 22, then continue the guarded exact-SHA DEV staging
and activation for app `6dc96205`; confirm hosted release readback and mobile
single-save UAT. Do not bypass the public permission check.
