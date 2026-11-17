# Studio V18 — DEV API staging hardening following Orca blocker

- Date: 2026-11-17
- Pull request: #1711 (Draft), branch `ops/v18-dev-api-artifact-20261117`
- Candidate V18 application SHA: `b5d1886b8bbd004e3c7d30a7724cae673d7879ef`
- Scope: BUILD only — GitHub source and synthetic tests. No hosted changes.

## Finding

Orca worker `ctx_b92186d6b1a8` (follow-up to `ctx_7961b98dd793`) was blocked by its read-only sandbox and wrong initial checkout despite reaching PR head for inspection. The worker reported existing static/offline checks passing but identified three actual gaps in `scripts/mydevil/manual-dev-api-stage.sh`:

1. `tar -tvzf` type validation rejected only hardlinks and symlinks, not FIFO/devices/sockets.
2. `while ... done < <(tar -tzf ...)` consumed output without checking the producer's exit code.
3. The dependency policy checker was executed from `source_dir` without proving its bytes against immutable Git source.

## Change

- Embed `verify_archive()` with checked `tar -tzf` and `tar -tvzf` command substitutions, strict member allowlist, control-character and path normalization, only regular files/directories, entry counts matching both listings, no raw untrusted tar diagnostics.
- Embed `verify_approved_dependency_gate()`: compare candidate and approved `origin/master` Git blob SHA and on-disk source hash. For execution, retrieve checker bytes via `git cat-file blob`, verify hash, and invoke only this trusted materialized copy; remove it before publishing the private staged runtime.
- Expose read-only `--verify-archive <file>` and `--verify-dependency-source <git-mirror> <source-dir> <sha>` modes for synthetic regression without MyDevil.
- Extend `scripts/ci/manual-dev-api-stage.test.sh` with synthetic successful TAR, symlink/FIFO, unexpected members, corrupt gzip, tampered on-disk checker, and candidate/master checker mismatch.
- Preserve all existing runtime isolation, quota, FreeBSD native dependency verification, SHA approval and staging-only boundaries.

## Validation

- GitHub update_file source writes: PASS, all changes on existing PR branch.
- Isolated local **reproduction of the newly introduced archive helper logic**, Bash syntax and GNU tar synthetic fixtures: regular archive PASS, symlink BLOCKED, FIFO BLOCKED, truncated archive BLOCKED.
- Isolated local **reproduction of dependency hash verification logic**, synthetic Git history: approved policy PASS; on-disk tamper BLOCKED; candidate/master mismatch BLOCKED.
- These reproduced helper tests **are not an execution of the complete exact-HEAD PR script**; therefore the exact-HEAD full staging regression, Mac/BSD tar compatibility and FreeBSD npm22+bcrypt+Sharp are **NOT VERIFIED**.
- Hosted MyDevil staging, live application activation, restart, database writes and production writes: NOT EXECUTED.

## Rollout

NONE. All edits remain on Draft PR #1711; no merge or MyDevil upload.

## Follow-up

On the exact new PR head, run `bash -n scripts/mydevil/manual-dev-api-stage.sh`, `bash scripts/ci/manual-dev-api-stage.test.sh`, and `bash scripts/ci/manual-dev-api-packaging.test.sh` in a writable Mac checkout. Fix any platform-specific regressions. Then independently authorize private artifact transport and FreeBSD `--plan`; runtime staging `--execute` is a separate approval. Implement API activate/recover before live DEV promotion. Owner-approved PUBLIC CONNECT deferral remains unchanged.
