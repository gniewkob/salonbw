# Fix: stdin-based DEV API activation preflight silently skipped

- Date: 2026-11-17
- Scope: Studio V18 DEV API fallback, PR #1711 (Draft)
- Candidate app SHA: `b5d1886b8bbd004e3c7d30a7724cae673d7879ef`
- Source revision before fix: `4c1e3d4c14078f180eea417670d1293095e47dd0`
- Environment: GitHub source changes and Node.js 22 isolated reproduction only

## Finding

Owner's Mac QA ran 7/7 synthetic tests at exact OPS SHA `4c1e3d4` (PASS), then issued:

```sh
ssh ... node22 - --plan "$APP_SHA" "$DIGEST" < scripts/mydevil/manual-dev-api-activate.cjs
echo 'DEV_API_ACTIVATION_PREFLIGHT=PASS'
```

The result contained **only the local echo**, not the script's required `DEV_API_ACTIVATION_PLAN=PASS sha=...` marker.

Direct Node.js 22 reproduction establishes that when a CommonJS script is run through stdin (`node -`), `require.main` is undefined and `module.id` is `[stdin]`. Previous file had `if (require.main===module) main().catch(...)`, so remote `--plan` silently executed no validation and exited 0. The same affected any proposed stdin-based `--execute` and `--recover` call. Previous final-echo PASS **was not host activation-plan evidence**.

## Change

- `scripts/mydevil/manual-dev-api-activate.cjs`: invoke `main()` if this is direct-file CLI **or** stdin entry point with `module.id==='[stdin]'` and `process.argv[1]==='-'`. Imports used by isolated tests remain inert.
- `scripts/ci/manual-dev-api-activate.test.cjs`: add regression invoking actual script content through Node stdin, asserting unsafe host fails closed and does not print plan PASS; also assert direct-path invocation fails closed. The prior seven synthetic tests remain unchanged.

## Validation

- Node.js v22.16.0 independent reproduction of `require.main` mismatch with stdin: **PASS** (old behavior reproduced).
- GitHub source update: **PASS**, same PR branch.
- Full updated exact-HEAD 8-test Mac suite: **NOT YET RUN**.
- MyDevil corrected activation `--plan`: **NOT YET RUN**.
- Host mutations: **NONE**. No API activation, Passenger restart or DB changes.

## Next

1. Fetch exact new PR HEAD and run `node22 --check` plus the updated Node tests in a clean Mac worktree (expect eight tests).
2. Rerun read-only remote `--plan` and require both the script-owned `DEV_API_ACTIVATION_PLAN=PASS sha=...` marker and host-zero exit; do not rely on a trailing local echo.
3. Review and authorize `--execute` separately only after real FreeBSD plan passes. Confirm explicit recovery procedure and live restart/health on the actual DEV host.
