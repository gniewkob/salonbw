# WhatsApp Cloud API version upgrade — isolated DEV change

**State:** Draft, unverified in Meta sandbox. Do not use this document as production approval.
**Issue:** #1671. **Base:** PR #1670 (audited recipient opt-in + dispatch gate).

## Reason and sources

The former WhatsApp adapter targeted `https://graph.facebook.com/v17.0/{phone-number-id}/messages`.
According to Meta's Graph API version lifecycle, `v17.0` expired on **2025-09-12**.
An expired URL must not be relied upon for stable, tested WhatsApp Cloud API behavior.

- Primary version lifecycle and changelog:
  https://developers.facebook.com/docs/graph-api/changelog/versions/
- Primary WhatsApp Business Messaging Policy, §1 and §2:
  https://whatsappbusiness.com/policy/

In November 2026, `v26.0` is the latest Graph API version announced
(2026-07-29); `v25.0` is also supported. These are version lifecycle facts;
they do **not** prove the project's message templates are approved, that
the credentials work, or that any attempted message was delivered.

## Implementation

- Use a pinned Graph API version: `WHATSAPP_GRAPH_API_VERSION`.
- Default: **`v26.0`**. The intentionally narrow allowlist is
  **`v25.0` or `v26.0`**. Retired versions, malformed values, path injection,
  blank values and unknown future versions are rejected on startup.
- URL built from validated version: `https://graph.facebook.com/{version}/{phone-number-id}/messages`.
- Keep customer `customerId` + communication-type eligibility checks,
  current recipient comparison, retry checks and staff/customer isolation.
- No new outbound capability, no change to customer grants, provider token
  permissions, pricing, templates or data schema.
- Existing DEV environment protection (`APP_ENV=development`,
  `OUTBOUND_DELIVERY_ENABLED=false`) remains in force.
- Production API .env may specify a supported version; if unset the
  application uses the pinned default. Existing deployment preserves
  server-only non-generated .env keys.

## Synthetic verification

- Jest/Nock exercises the default `/v26.0/.../messages` path and existing
  request body, including template variables, authorization, retries and
  fail-closed recipient checks.
- Additional Nock case exercises configured `v25.0`.
- Invalid versions (`v17.0`, `v24.0`, malformed/path-like/empty) are rejected.
- None of these mocked tests constitute Meta provider-compatibility evidence.
- Do not enable real delivery or use live customer numbers on staging.

## Required gates before production

1. Exact-SHA full CI, including backend lint/typecheck/Jest and regressions.
2. Controlled Meta sandbox validation by the owner for `POST /messages`,
   approved template names/language/body, authentication, errors,
   rate limits and acceptance response; use only designated test recipients
   and an explicitly authorized environment.
3. Confirm successful HTTP 2xx only represents provider acceptance;
   delivery/failed delivery requires separate webhook status handling.
4. Complete PR #1670 UAT and owner/privacy review; resolve the independent
   employee messaging evidence requirement.
5. Review release/rollback, independently authorize the production change.

**Current state:** Source prepared for tests; no sandbox send, no production deployment.
