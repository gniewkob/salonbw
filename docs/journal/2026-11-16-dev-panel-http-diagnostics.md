# DEV panel activation HTTP diagnostics

- Date: 2026-11-16
- Agent: Codex
- Base: d22b384bbcf786089734b6cdfdfd6dc188f67a18 (OPS branch)

## Finding
`manual-dev-panel-activate.mjs` swallowed all HTTP errors, including release mismatches, and emitted only a generic failure. Static metadata and dynamic Passenger login were indistinguishable. Arbitrary build-ID text could satisfy the login check.

## Change
Export the verifier with injectable test dependencies. Retain static HTTP, dynamic HTTP, release mismatch, dynamic build mismatch and transport failure classes; log only controlled check labels, numeric status and retry count. Verify `__NEXT_DATA__.buildId` using the existing warm-up convention. Preserve fixed DEV origin, manual redirects, Basic authentication, exact SHA validation and automatic rollback/recovery. Unix smoke inspected and unchanged.

## Validation
Behavioral fail-first: expected live-release-mismatch, received live-http-verification-failed before fix. Focused activation and Unix-smoke tests: 28 PASS after fix. Syntax and whitespace checks PASS. Tests use synthetic files, injected HTTP responses and a private local Unix socket; no hosted mutation.

## Rollout
Not deployed. No Passenger restart, persistent-data modification or production access. Exact-head CI remains a separate check.

## Follow-up
Review feature PR against the OPS source branch and verify exact-head CI; hosted activation requires separate authorization.
