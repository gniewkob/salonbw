# SalonBW Landing — RC1 integration handoff

Date: 2026-10-31
Status: **CANDIDATE / NO DEPLOY**. All prices and booking routes continue to be API-backed.

## Exact parent revisions

- WDI L1–L6 cumulative head: `2defa9f85c0ed3628ad0550e841467618fecd91c` ([PR #1586](https://github.com/gniewkob/salonbw/pull/1586)); branch was already 85 commits ahead of immutable master baseline.
- Independent security remediation: `1ced2e70a441389ded5a075659f8bf06b670644e` ([PR #1576](https://github.com/gniewkob/salonbw/pull/1576)).
- Master at integration preflight: `b208e36ebb9df508bc8f4555346d1de9ffa5e9b7`.
- Two-parent merge commit created as RC1. Exact resulting SHA and CI evidence are linked in the RC PR; do **not** infer acceptance from its presence.

## Source and conflict resolution

All Landing L1–L6 files, first-party images and browser tests originate from the cumulative L6 head. Security-only files originate from the exact #1576 head: dependency lock, backend npm overrides, production dependency gate, deploy checks, agent instructions and the security journal.

There are exactly **two common modified paths**:
1. `.github/workflows/ci.yml`: use security workflow as baseline (pnpm lock/workspace triggers plus API dependency gate); keep the seven Landing Jest targeted tests from L6.
2. `docs/PROJECT_STATE.md`: preserve all Landing records and prepend the independent security entry, without removing historical state.

This is a **source integration only**, not permission to skip GitHub workflow gates, review or release approvals.

## Required exact-commit checks

- GitHub CI all required jobs green (including Security Audit, backend API dependency checks, Gitleaks and deployment static checks).
- WDI Browser QA on real `next build/next start` with synthetic catalog: ≥12 Cypress checks and 9 screenshot pixel-width assertions; manual review of the image artifact.
- Review diff for merge inconsistencies: no removed features, no changed BookingModal service IDs, only the documented tablet navbar and mobile floating CTA changes.
- Run controlled staging/DEV deployment of Landing **only after staging approvals**. Real hosted DEV (not synthetic browser CI) must verify API category, price, duration, online/offline services, nested variants and login redirect.
- Final PL/EN/DE visual review, keyboard/focus checks, mobile Safari, Lighthouse and photo crop; then owner approval before any production release.

## Safety boundary

No database write, API deployment, Booksy mutation, customer data, notifications or production changes in RC preparation. Do not bypass #1576 security gate or force-merge protected master.
