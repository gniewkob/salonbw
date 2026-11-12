# Customer consent & communication preferences

Source of truth for the unified consent model (Issue #1657 P0). Code:
`backend/salonbw-backend/src/communication-consents/`, panel
`apps/panel/src/{api/communicationConsents.ts,hooks/useCommunicationConsents.ts,components/communication/}`.

## 1. Model — four separate concepts

| Concept | Storage | Meaning |
|---|---|---|
| Marketing consent | `customer_consents` (purpose × channel) | Recorded customer decision with source, actor, text version, evidence. No row = `UNKNOWN`. |
| Preference | `communication_preferences` (type × channel) | Delivery choice. No row = default (legacy `notify*` for operational, "no objection" for marketing). |
| History | `consent_events` | Append-only audit, written in the same transaction as the state change. |
| Eligibility | derived (`evaluatePreference`) | Effective permission at send time. UI and delivery use the same function. |

Purposes: `DIRECT_MARKETING` (SMS/EMAIL/WHATSAPP), `NEWSLETTER` (EMAIL),
`REVIEW_REQUEST` (SMS/WHATSAPP). Types and supported channels: see
`COMMUNICATION_TYPES` (catalog endpoint). Operational: booking confirmation,
reminder, change, cancellation. Everything else is marketing-class and needs a
`GRANTED` consent for its purpose on that channel.

### Legacy data
`users.smsConsent/emailConsent/whatsappConsent` are **not** migrated into
consents (no evidence). They surface as `legacyUnverifiedConsent=true`,
`status=UNKNOWN`, reason `LEGACY_CONSENT_UNVERIFIED` → **marketing denied**.
The columns are kept and mirrored from `DIRECT_MARKETING` grants/withdrawals so
old readers stay consistent. Contract (drop) phase only after all callers move.

### Retention
`consent_events` cascade-delete with the customer (erasure). Rows are never
updated (trigger). Staff deletion nulls `actor_id` but keeps `actor_role`.
Retention period for consent evidence after withdrawal = owner/legal decision
(proposed: as long as the customer record exists, to demonstrate lawful past
sending — Art. 7(1) GDPR).

## 2. API

| Method | Path | Who |
|---|---|---|
| GET | `/communication-consents/catalog` | all roles |
| GET/PUT | `/customers/:id/communication-preferences` | admin, employee, receptionist |
| GET | `/customers/:id/consent-history?page&limit` | staff |
| POST | `/customers/:id/consents/grant` | staff — `source` ∈ evidence sources + `evidenceReference` required |
| POST | `/customers/:id/consents/withdraw` | staff — no evidence/justification |
| GET/PUT | `/users/profile/communication-preferences` | client (own, from JWT) |
| GET | `/users/profile/consent-history` | client (no actor id / evidence) |
| POST | `/users/profile/consents/grant` \| `withdraw` | client (provenance set by server) |
| POST | `/customers` with `communication: {grants, source, evidenceReference, preferences}` | staff, atomic with the customer |

All mutations accept `Idempotency-Key`; replay returns current state, reuse with
a different body → 409. Responses return the full `CommunicationState`.
Errors: 400 (validation, missing evidence, outdated statement version,
unsupported channel), 403 (role/ownership), 404 (not a client), 409 (key reuse).

## 3. Enforcement (send paths)

| Path | Gate |
|---|---|
| `SmsService.sendSms` (manual, bulk, template, reminder, automatic messages) | resolve customer (recipientId+phone match, or unique phone) → classify (trusted context, else template type, else appointment-linked free text = APPOINTMENT_CHANGE, else MASS_MARKETING) → `canSend`. Denied → log `Failed`, no provider call. |
| `EmailsService.sendCustomerCommunication` | reminder e-mail |
| `EmailsService.sendAsUser` (+ bulk) | customer address ⇒ MASS_MARKETING; 403 / counted as `blocked`. Non-customer addresses are outside the model. |
| Appointment notices (WhatsApp → e-mail fallback) | BOOKING_CONFIRMATION / APPOINTMENT_CHANGE / APPOINTMENT_CANCELLATION |
| Post-visit WhatsApp follow-up | POST_VISIT_REVIEW (needs REVIEW_REQUEST consent) |
| Reminder cron | APPOINTMENT_REMINDER per channel |
| Newsletter dispatch | re-checked per recipient; delivery not implemented → never reported as sent |

Not gated (not customer marketing): password reset, contact form, salon alert
mailbox, employee booking WhatsApp.

## 4. Legal mapping (verify with counsel)

| Requirement | Source | Implementation |
|---|---|---|
| Prior consent for commercial info via terminal equipment/automated calls, per channel | PKE art. 398 (Dz.U. 2024 poz. 1221, from 2024-11-10); UODO/MC: consent names entity, purpose, channel; phone ≠ e-mail | purpose × channel scopes, no cross-channel inference |
| Demonstrate consent | GDPR art. 7(1) | source, actor, timestamp, text version, evidence ref |
| Withdrawal as easy as giving | GDPR art. 7(3) | one action + confirmation, no justification |
| Freely given, not bundled with service | GDPR art. 7(4) | marketing never required to create a customer/book; never pre-ticked |
| Operational messages | GDPR art. 6(1)(b) (contract) | separate class, governed by preferences only |
| Data minimisation | GDPR art. 5(1)(c) | customer history omits staff evidence/actor ids |

The table structure itself is an internal design decision, not a GDPR requirement.

### Open owner/legal decisions
1. Final consent wording (all texts are `*-draft`); register form wording must match the recorded version.
2. Classification of POST_VISIT_REVIEW (currently marketing, conservative).
3. Legacy flags: keep denying marketing until re-consent (current) vs. accept with documented evidence.
4. Staff free-form e-mail/SMS to a customer is treated as marketing (blocks ad-hoc operational texts without appointment link).
5. Retention of consent evidence after withdrawal.

## 5. ChatGPT UI integration handoff

**Types / hooks** — `apps/panel/src/api/communicationConsents.ts`,
`apps/panel/src/hooks/useCommunicationConsents.ts`:
`useCommunicationCatalog()`, `useCommunicationState(scope)`,
`useConsentHistory(scope, page, limit)`, `useGrantConsent(scope)`,
`useWithdrawConsent(scope)`, `useUpdateCommunicationPreferences(scope)`;
`scope = {kind:'customer', customerId} | {kind:'self'}`. Mutations write the
returned state into the cache (no optimistic updates) and invalidate history.
Pass the same `idempotencyKey` for retries of one confirmation.

**Components (functional, minimal styling — safe to restyle):**
```ts
<CustomerCommunicationPreferences scope audience="staff"|"customer" />
<CustomerConsentConfirmation request onConfirm(evidence?) onCancel pending />
  // request: {title, summary[], statement?{text,version,draft},
  //           requireStaffEvidence?, staffSources?, confirmLabel?, destructive?}
<CustomerConsentHistory scope audience pageSize? />
<InitialConsentFields value onChange idPrefix disabled? /> + toCommunicationPayload()
```
Rules the visual layer must keep: show `legacyUnverifiedConsent` as "not valid
for marketing"; unsupported cells (`supported:false`) are not toggles; marketing
scopes on creation start unchecked; staff grant needs source+evidence; withdrawal
never asks for a reason; render only API history (no placeholder rows); show the
exact statement text + version on grant.

**ChatGPT may modify:** `components/communication/*` markup/CSS, V18 CSS modules,
placement inside `CustomerCommunicationTab`, `/account`, V18 pages.
**Claude-owned (do not change concurrently):** backend `communication-consents/`,
migration, `api/communicationConsents.ts`, `hooks/useCommunicationConsents.ts`,
eligibility wiring in sms/emails/appointments/notifications/newsletters.
