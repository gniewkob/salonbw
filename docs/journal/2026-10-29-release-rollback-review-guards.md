# Release safeguards: historical rollback and DEV snapshot integrity

- Date: 2026-10-29
- PR: #1556 (Draft / production NO-GO)
- Previous commit: `2cdfa579a2dd7f533e5cb1428c93b37d301d625e`
- Previous CI: [40787371174](https://github.com/gniewkob/salonbw/actions/runs/40787371174), 9/9 PASS

## Findings

1. P1: `scripts/deploy-environment.sh` correlated a dispatched GitHub
   Actions run's `headSha` with the requested application release SHA.
   `gh workflow run --ref master -f ref=<historical-release>` instead uses
   the master workflow source SHA for `headSha`. A legitimate production
   rollback could therefore dispatch the API but fail to identify its run
   and stop before the frontends, despite an ongoing API deployment.
2. P2: `scripts/mydevil/staging-release-snapshot.sh` trusted the `READY`
   marker and snapshot metadata without confirming the copied files were
   still present. A corrupted backup could erase current app files on rollback.

## Changes

- Resolve and validate the workflow source SHA at execution time for both
  environments. Match `run.headSha` to that source, but continue matching
  the requested application SHA independently in the run title.
- Preserve staging's stronger rule requiring workflow SHA to equal release
  SHA: never silently deploy with older snapshot-less workflows.
- Check staging snapshot manifest before runtime removal, including present
  paths, unknown entries, duplicate entries and missing files or directories.
  On any mismatch refuse rollback without modifying the active application.
- Add mocked production historical rollback/invalid-workflow/unrelated-run
  cases; add synthetic corrupted frontend and API snapshot refusal tests.

## Verification and remaining gates

- Prior exact-SHA CI was green, but does not validate these new changes.
- New CI must prove P1/P2 regression tests and all application checks PASS.
- Read-only code/security review remains required on the new exact SHA.
- No hosting changes, database migrations, Booksy cutover or notifications.
- Hosted synthetic DEV UAT and independently isolated restore/rollback drill
  remain required before production release.

## Next step

Verify new CI and review; then deploy approved SHA to isolated DEV, confirm
application releases, auth, booking and no outbound activity; demonstrate
safe per-app restore. Take a current production database backup and validate
isolated restoration before approving production release.
