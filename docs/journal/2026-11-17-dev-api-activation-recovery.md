# 2026-11-17 — Minimal DEV API activation/recovery (Studio V18)

- **Scope:** BUILD only; PR #1711 (Draft)
- **App candidate:** `b5d1886b8bbd004e3c7d30a7724cae673d7879ef`
- **Existing stage:** verified FreeBSD runtime, dependency gate, bcrypt/Sharp, 1393 `dist` files identical to archive; no live activation
- **New implementation:** `scripts/mydevil/manual-dev-api-activate.cjs`
- **Regression:** `scripts/ci/manual-dev-api-activate.test.cjs`

## Finding

The V18 API candidate is staged privately under `~/.salonbw-manual/staged-api/<SHA>`, but no tested activation/recovery path exists. MyDevil's DEV API domain resolves to a fixed app root `~/apps/nodejs/api_salonbw_dev`. Its additional five directories are `uploads`, `tmp`, `public`, `scripts` and `.diagnostics`; multiple API services resolve upload roots using `UPLOADS_DIR` or `process.cwd()/uploads`. Replacing the entire runtime directory or changing the domain link would risk breaking uploads. Historic DEV snapshot helpers are complex and copying large `node_modules` would consume substantial MyDevil quota.

## Change

A small Node.js 22 command with modes `--plan <sha> <digest>`, `--execute <sha> <digest>`, and `--recover <sha>`.

- Fixed target and domain: `apps/nodejs/api_salonbw_dev` and `dev-api.salon-bw.pl` only; no arbitrary destination CLI option; FreeBSD-only and account-home check
- Read-only preflight checks DEV mapping, stage release metadata, private `.env` isolation, expected DB/cookie/outbound flags, archive SHA-256 and same-filesystem moves
- `--execute` requires `SALONBW_DEV_API_ACTIVATE_APPROVED_SHA` exact SHA. It creates one private recovery generation, journals old/new whitelisted release names and **moves** only known code/dependencies and runtime `.env` from live into recovery, then the candidate from staging into fixed live root
- `--recover` requires `SALONBW_DEV_API_RECOVER_APPROVED_SHA` exact SHA. It restores previous code and `.env`; checks possible collisions before changes and supports interrupted prior moves
- Both paths leave `uploads`, `tmp`, `public`, `scripts` and `.diagnostics` untouched. No deletion, no app-root symlink switch, no database migrations, no network calls or Passenger restart
- No copied second `node_modules`: same-filesystem rename required; one private recovery generation for the exact SHA, no automatic cleanup/pruning
- A lock prevents concurrent release file operations. A crash leaving a lock requires **read-only diagnosis and manual decision** before reuse; never force cleanup
- A successful file move is **not** a healthy running release. After separately authorized Passenger restart, verify exact API release header, health, isolation, authentication and UAT. If failed, separately approve recovery, restart and recheck

## Validation

**PASS — isolated disposable Linux fixture (Node.js 22.16):**

- `node --check scripts/mydevil/manual-dev-api-activate.cjs`
- `node --test scripts/ci/manual-dev-api-activate.test.cjs` — **7/7 PASS**: read-only plan/digest, full activation and recovery, interrupted moves (old phase and new phase), corrupt recovery generation refusal, invalid stage metadata/domain/runtime refusal, duplicate backup refusal
- Synthetic persistent data markers under all five protected directories remain unchanged and domain symlink resolves to same live root
- GitHub blob hashes for source and test match locally tested bytes: source `f8ed2eed7731644564776fdf9f7f224eeea1d991`, tests `e780e5db7a6edc31cea828fd5aac893cfea4dd2a`

**NOT VERIFIED:** exact PR HEAD run on operator Mac, native FreeBSD `--plan`, independently reviewed host activation/recovery, live HTTP, GitHub Actions CI (billing/start block). Zero hosted mutations in this task.

## Rollout

**NOT STARTED.** The existing working DEV API stays active. No production, domain, database, Passenger, uploads or external outbound operations.

## Follow-up

1. On clean exact PR head, run `node --check` and `node --test` for new files, plus existing staging/packaging tests.
2. Run `node22 scripts/mydevil/manual-dev-api-activate.cjs --plan <app-sha> <artifact-sha256>` **on MyDevil as read-only** using reviewed exact OPS SHA, via SSH stdin. Do not run `--execute` by default.
3. Review script and host readiness. Only after owner authorizes a bounded DEV activation, execute exact SHA file swap, separately restart DEV API, verify live `X-SalonBW-Release` and `/healthz`. If unsuccessful, use the explicitly approved recover mode and restart again. Preserve prior generation for review. Keep PROD isolated.
