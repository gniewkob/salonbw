# Security Guidelines

## Secrets Management

- `.env.example` files illustrate required variables; keep real values in untracked `.env.local` or a secret manager (e.g., GitHub Actions Secrets, Vault).
- Never commit API keys, database credentials, or tokens. Rotate credentials immediately if exposure occurs.
- Frontend environment variables prefixed with `NEXT_PUBLIC_` are publicly accessible and must contain non-sensitive data.

## Access Control

- Limit production database access to whitelisted hosts; upcoming SSH tunnel scripts will mediate secure access for developers.
- Administrative dashboards (Next.js) should remain behind authentication; ensure new routes inherit existing guards.
- NestJS JWT secrets and refresh tokens must be long, random values stored outside of source control.

## Dependency Hygiene

- Keep npm dependencies updated within each project. Use `npm outdated` and review changelogs before upgrades.
- Run `npm audit` (or organisation-wide security scans) regularly and remediate high-risk advisories promptly.
- Avoid introducing abandoned or unmaintained packages without prior discussion.

## Process and File Safety

- Shell execution: do not use `shell: true` with user- or repo-controlled input. Prefer `spawn`/`execFile` with explicit argument arrays.
- Filesystem access: normalise and validate any input-derived paths. Constrain file operations under an allowlisted base directory and prevent traversal.
- URL handling: only allow `http`/`https` schemes for outbound requests and configuration values (e.g., API base URLs).
- TLS settings: never set `NODE_TLS_REJECT_UNAUTHORIZED=0` in code or CI. For local troubleshooting, use targeted tooling rather than globally disabling verification.

### Database TLS

- PostgreSQL connections in production use verified TLS by default. If you need TLS, set `PGSSL=1` and provide a trusted CA when required by your provider. We do not disable certificate verification; avoid `rejectUnauthorized: false`.

## CI/CD Hardening

- Pin GitHub Actions to immutable SHAs and validate inputs before interpolation in shell steps.
- Prefer scripting (Python/Node) for complex logic and to avoid brittle quoting in shell.
- Do not keep generic remote-shell workflows in GitHub Actions for production infrastructure. If remote operations are unavoidable, they must be allowlisted, auditable, and scoped to a narrow set of maintenance commands.
- Do not expose raw production `app.log` retrieval via workflow_dispatch. Log access should be redacted, targeted to a specific service, and limited to the minimum line window needed for incident response.
- SSH automation must use pinned host keys (`known_hosts`) and `StrictHostKeyChecking=yes`. Avoid `StrictHostKeyChecking=no` in all CI/CD and ops workflows.
- Test-data workflows must never default to production endpoints. Any synthetic data injection must target non-production environments only and require explicit confirmation.

## Data Handling

- Sanitise and validate all inbound data with `class-validator` on the backend.
- Scrub personally identifiable information (PII), authentication material, and financial identifiers from logs by default, not only "where feasible".
- Backend HTTP logging must redact `authorization`, `cookie`, `x-log-token`, password-like request fields, and `set-cookie` response headers before logs leave the process.
- Client-side error ingestion must sanitize message/stack/extra payloads before writing to app logs or Loki.
- Gift card codes, phone numbers, SMS/WhatsApp payloads, and provider error payloads must be masked or redacted in application logs and workflow outputs.
- Backups and exports should be encrypted in transit and at rest.
- A backup is not considered sufficient for sensitive data unless restore has been tested on a controlled environment.
- Before loading real financial or personal data, verify access paths for logs, SSH automation, backup storage, and CI/CD secrets handling as a single review scope rather than treating application auth in isolation.

## Incident Response

- Document incidents in a shared log with timeline, impact, and resolution steps.
- If code changes are required, open a dedicated hotfix branch and request expedited review.
- Post-incident reviews should capture preventive actions and update this document when policies evolve.
