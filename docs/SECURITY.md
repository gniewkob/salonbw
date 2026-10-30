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

- **Target control (recommendation, not a confirmed current state):** protect PostgreSQL connections over TCP with TLS and server-identity verification (equivalent to `sslmode=verify-full` for libpq), using a trusted provider CA and the correct DNS hostname. Do not disable certificate verification (for example, `rejectUnauthorized: false`). See [PostgreSQL 16 libpq connection parameters](https://www.postgresql.org/docs/16/libpq-connect.html) and [SSL support](https://www.postgresql.org/docs/16/libpq-ssl.html).
- **Observed production state (2026-10-30):** an application-side read-only `pg_stat_ssl` query reported `ssl=false`; therefore verified TLS on this live database session is **not established**. Track this as [#1573](https://github.com/gniewkob/salonbw/issues/1573). This does not by itself establish public network exposure or a security incident.
- **Rollout gate:** first confirm MyDevil PostgreSQL TLS support, server hostname and trusted CA, and the actual application-to-database network path. Validate a new connection without changing production configuration; only then seek separate authorization for changing `PGSSL` or connection parameters and verify the live session with `pg_stat_ssl`. Never assume that merely setting `PGSSL=1` proves certificate-chain or hostname validation.

## CI/CD Hardening

- Pin GitHub Actions to immutable SHAs and validate inputs before interpolation in shell steps.
- Prefer scripting (Python/Node) for complex logic and to avoid brittle quoting in shell.

## Data Handling

- Sanitise and validate all inbound data with `class-validator` on the backend.
- Scrub personally identifiable information (PII) from logs where feasible.
- Backups and exports should be encrypted in transit and at rest.

## Incident Response

- Document incidents in a shared log with timeline, impact, and resolution steps.
- If code changes are required, open a dedicated hotfix branch and request expedited review.
- Post-incident reviews should capture preventive actions and update this document when policies evolve.
