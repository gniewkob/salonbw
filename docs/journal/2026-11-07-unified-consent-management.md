# 2026-11-07 — Unified customer consent & communication preferences (Issue #1657 P0)

Branch `feat/v18-communication-consents-20261107`, stacked on
`design/v18-localized-date-inputs-20261106` (#1656, `411b7e8`). DEV only.

## Finding
- Marketing consent was 3 global booleans (`smsConsent/emailConsent/whatsappConsent`)
  with no source, evidence, text version or actor; history was best-effort
  `logs` written *after* the save (not atomic).
- V18 Communication tab repeated the same global flags in 5 message-type rows
  (fake matrix); customer creation showed different consent fields than the profile.
- Send paths were inconsistently gated: staff manual/bulk SMS — no check;
  automatic messages — per-rule `requireSmsConsent` that admins could disable;
  post-visit WhatsApp follow-up — gated on operational `notifyWhatsapp` only;
  newsletters marked recipients **Sent** without sending anything.

## Change
- Backend module `src/communication-consents/`:
  - tables `customer_consents` (purpose × channel, GRANTED/WITHDRAWN; no row = UNKNOWN),
    `communication_preferences` (type × channel), `consent_events` (append-only,
    UPDATE-rejecting trigger that tolerates only FK SET NULL), `consent_requests`
    (Idempotency-Key). Migration `1762630000000` (expand only; legacy columns kept;
    no backfill, no fabricated history). varchar + CHECK, not pg enums.
  - `CommunicationConsentsService`: state + event in one transaction, `SELECT … FOR UPDATE`
    on the customer row, idempotent replay / 409 on key reuse, no-op changes write nothing.
    Staff grants need an evidence source + reference + current statement version;
    self-service grants get server-set provenance (body source/evidence ignored).
  - `CommunicationEligibilityService.canSend()` — single decision point using the same
    pure `evaluatePreference()` as the UI. Fails closed.
  - Enforced in: `SmsService.sendSms` (all SMS: manual, bulk, template, reminder,
    automatic messages), `EmailsService.sendCustomerCommunication` / `sendAsUser`
    (+ bulk counts `blocked`), appointment WhatsApp/e-mail notices and follow-ups,
    reminder cron channel choice, newsletters (re-check at dispatch, never fake "sent").
  - Legacy paths audited: `PUT /customers/:id`, `PATCH /users/profile/consent`,
    registration → events; staff cannot switch marketing on via a plain boolean (400).
  - Old `GET customers/:id/consent-history` replaced (new shape, legacy log entries
    returned separately as `legacyItems`).
- Panel: `api/communicationConsents.ts`, `hooks/useCommunicationConsents.ts`,
  `components/communication/*` (preferences, confirmation, history, initial fields).
  Wired into V18 + legacy creation (shared `CustomerFormFields`), V18 profile
  Communication tab, legacy Consents tab, client `/account`, V18 summary card.
- CI: new step "Test PostgreSQL consent integrity".

## Validation
- Backend unit: 548 passed; 4 failures = `system-status.http.spec.ts`, fail identically
  on the untouched base locally (Express/Nest dev-deps mismatch; `sharp` also missing).
- PostgreSQL 15 (local container): `communication-consents.pg-spec` 11/11,
  `appointments-concurrency` + `password-recovery` green (36+ total).
- Panel: 559/559, `tsc` + eslint clean.
- CI / DEV deploy: see PR.

## Next step
Owner/legal: approve consent wording (texts are `*-draft`), classification of
POST_VISIT_REVIEW, and the legacy-flag policy before production. ChatGPT: V18 visual
layer per `docs/CONSENT_MANAGEMENT.md` §Handoff.
