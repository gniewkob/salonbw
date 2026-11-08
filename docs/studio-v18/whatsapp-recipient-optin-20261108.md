# WhatsApp recipient opt-in and send-time eligibility — DEV design

**Scope:** SalonBW V18 customer-facing WhatsApp via Meta Business Platform.
**Status:** Draft / DEV only, not a production authorization.
**Related:** Issue #1668, stacked on PR #1669.

## Source and obligation

**Meta WhatsApp Business Messaging Policy** (last updated 2026-09-23),
section **1. Create a Quality Experience**, states that WhatsApp business
contact requires (a) recipient-provided phone/username and (b) opt-in permission
for subsequent messages, and that opt-outs must be respected.

Source: https://whatsappbusiness.com/policy/

The same policy's **Best Practices for Opt-In** recommends clarifying message
categories and opt-out mechanisms. It does **not** prescribe a separate
checkbox for each category or a particular database schema. This change's
independent `WHATSAPP_APPOINTMENT_UPDATES` consent is **SalonBW's product
design choice** for clear operational/marketing separation, not a legal claim
that every appointment notification requires its own statutory marketing consent.

GDPR Article 7(1) concerns the controller's ability to demonstrate consent
where processing is based on consent; Article 7(3) concerns withdrawal.
Source: https://eur-lex.europa.eu/eli/reg/2016/679/oj
This documents how opt-in evidence is stored; it does **not** classify all
operational appointment notifications as direct marketing.

## Recipient model

1. `customer_consents` stores one opt-in per customer/purpose/channel;
   `consent_events` records GRANTED/WITHDRAWN append-only audit with actor,
   source, reference and statement version.
2. New scope `WHATSAPP_APPOINTMENT_UPDATES / WHATSAPP` covers booking
   confirmations and changes; separately recorded `DIRECT_MARKETING` and
   `REVIEW_REQUEST` permissions remain independent.
3. `customer_consents.contact_value` stores the current normalized
   WhatsApp destination at grant. `consent_events.contact_value` also stores
   the historical destination on each GRANTED/WITHDRAWN event; regrant after a
   number change cannot overwrite earlier recipient evidence. The raw
   historical destination is not exposed by the customer-facing history API.
   A changed number requires another explicit confirmation. **No backfill**
   from `notifyWhatsapp`, `whatsappConsent`, or historical checkboxes.
4. Service opt-in requires a usable phone at grant. A pre-existing marketing
   registration flow can record the customer's choice even without a phone,
   but **must not permit delivery** until the current destination is confirmed.
5. Self-service grants/withdrawals use the authenticated client identity;
   staff grants require evidence, staff withdrawals record customer request.
   Idempotency and transaction/rollback use the existing consent infrastructure.
6. `notifyWhatsapp` is only a delivery preference. It cannot create opt-in
   or override a missing/withdrawn/mismatched consent.

## Dispatch gate

- `WhatsappService` now has customer-specific public methods that require
  `customerId` and a server-side communication type. They call
  `CommunicationEligibilityService.canSend` immediately before the transport.
- Eligibility checks client identity, current consent, current preferences,
  current phone, and exact destination passed to Meta. This check runs before
  **every** provider attempt, including retry after backoff. If opt-in is
  withdrawn between retries, no subsequent attempt is sent. When any check
  fails or eligibility cannot be loaded, no Meta request is made.
- `sendTemplate` is private transport code; call sites cannot bypass the
  customer gate by supplying an arbitrary template name.
- Staff notification `sendNewBookingToEmployee` remains a separate route.
  This PR does **not** establish proof of employee opt-in; this must be assessed
  as a distinct staff onboarding/policy requirement.
- False / rejected WhatsApp allows the existing, independently authorized
  e-mail fallback; no real outbound traffic in isolated DEV.

## User interface

- V18 **Powiadomienia o wizytach** shows separate opt-in grant/withdraw controls
  and the statement text before confirmation. **Marketing i zgody** stays
  independent.
- A change of phone is visible and permits a new confirmation, retaining
  the historical grant event.
- Changes to opt-in are shown in the existing consent history; staff actions
  require real evidence references.

## Acceptance and remaining gates

- [ ] Exact SHA backend lint, typecheck/build, unit/Jest.
- [ ] PostgreSQL migration & tests: grant, missing opt-in, regrant on changed
      phone, recipient mismatch, withdrawal, audit history and transactions.
- [ ] Frontend CI + manual DEV UAT for self-service and staff evidence flows.
- [ ] Verify actual DEV config: outbound disabled, no real messages.
- [ ] Review draft opt-in wording and privacy/legal information with owner.
- [ ] Assess separate staff WhatsApp opt-in evidence before expanding staff sends.
- [ ] Independent approval for any PROD release; do not merge automatically.
