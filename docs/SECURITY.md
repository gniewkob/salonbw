# Security Guidelines

## Secrets Management

- `.env.example` files illustrate required variables; keep real values in untracked `.env.local` or Vault solutions.
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

## Data Handling

- Sanitise and validate all inbound data with `class-validator` on the backend.
- Scrub personally identifiable information (PII) from logs where feasible.
- Backups and exports should be encrypted in transit and at rest.

## Incident Response

- Document incidents in a shared log with timeline, impact, and resolution steps.
- If code changes are required, open a dedicated hotfix branch and request expedited review.
- Post-incident reviews should capture preventive actions and update this document when policies evolve.
