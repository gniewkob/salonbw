# Studio V18 communication editor — UAT readability and privacy fixes

**Status:** source implemented on a non-deployed branch, CI pending, DEV UAT pending.
**Tracking:** [#1672](https://github.com/gniewkob/salonbw/issues/1672).
**Base:** Meta API modernization source branch (stacked after #1670).
**Scope:** panel V18 presentation, bounded forms and regression tests.
**No** database migration, send-time policy change, provider call, production release or outbound activation.

## Decisions and behavior

1. Distinguish selected preferences from actual delivery eligibility.
   - Group rows now display selected settings and separately the number of
     server-authorized message/channel combinations. The latter also requires
     the relevant contact address (or a panel destination).
   - These counts reflect **authorization state**, not actual delivery,
     provider acceptance or availability of outbound transport.
   - Unsaved drafts are explicitly marked pending and are not described as
     verified authorization until the server responds after save.
2. A WhatsApp preference can remain `preferred=true` while
   `effectiveAllowed=false`; this is clearly labelled **blocked**, with an
   amber visual state. It may still be turned **off**. Turning an off
   preference **on** remains disabled without valid recipient opt-in.
3. The per-message V18 layout uses fixed `PANEL/SMS/WHATSAPP/EMAIL`
   channel positions with meaningful unavailable placeholders; mobile width
   uses two columns. Existing non-V18 matrix/legacy styles are untouched.
4. On `supportedOnly` forms, replace the generic GDPR consent checkbox
   with an information notice linking to the existing public `/privacy`
   page. Preserve the historical `gdprConsent` field in the data model and
   non-V18 forms. The V18 personal-data editor omits that field from update
   payloads, preventing accidental writes during unrelated edits.
5. V18 customer overview no longer presents the legacy GDPR boolean as
   a simple consent badge. Independent audited marketing permissions remain.
6. Existing consent grants, withdrawals, staff-evidence requirements, audit
   records, idempotency, group switches and confirmation guards are unchanged.

## Evidence / sources

- [GDPR Regulation (EU) 2016/679, Article 6(1)(b)](https://eur-lex.europa.eu/eli/reg/2016/679/oj/pol):
  processing necessary for the performance of a contract is a distinct
  potential legal basis from consent; suitability depends on real processing
  purposes and the controller's legal review.
- [GDPR Article 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/pol):
  information to be provided when collecting personal data. A generic
  checkbox cannot replace the controller's notice obligations.
- [Meta WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/):
  opt-in and opt-out obligations. Our independent appointment-message consent
  is a product design choice, not an alleged requirement for a distinct
  checkbox in the provider policy.

## Acceptance gates

- [ ] Exact-SHA frontend lint, Prettier, TS build and React tests.
- [ ] Exact-SHA full CI; no automatic merge.
- [ ] Isolated Playwright desktop 1366 and mobile 390 verifies matrix alignment,
      blocked preference text, usable buttons and no horizontal overflow.
- [ ] Authenticated synthetic-customer UAT in DEV: blocked state, grant,
      withdrawal, number mismatch/regrant, draft cancel, separate marketing.
- [ ] Owner/privacy wording review, and separate production release approval.
- [ ] Historical GDPR database value preserved across V18 profile updates.

**No screenshots, private contact data, credentials or live messages included.**
