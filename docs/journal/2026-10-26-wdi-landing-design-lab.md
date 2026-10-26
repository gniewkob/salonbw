# WDI Design Lab — Landing Black & White

- Scope: independent landing-only experiments; no production change.
- Base: master \`0b1732e5c6168d8f781735484de038f93bd87693\`.
- Brand authority: \`.claude/skills/salonbw-brand/SKILL.md\`.
- WDI plugin version used: 1.1.1.
- Evidence: **STATIC** source inspection (no actual browser/performance numbers recorded).
- Target: \`apps/landing/src/pages/design-lab.tsx\`; production MUST answer 404.

## Goals and protected behavior

The owner wants a premium Black & White landing that makes booking easy.
Keep the existing functional homepage unchanged pending user selection.
Preserve booking modal and \`getPanelUrl('/booking')\`, PL/EN/DE, service pages,
forms, analytics consent, schema.org, social proof and business details.
No copying third-party source, premium prompts, screenshots, photography or claims.

## Research/reference board (public references, 2026-10-26)

| Source | Concrete link | Observed public pattern | Adoption decision |
| --- | --- | --- | --- |
| Land-book | https://land-book.com/brunobalt | Restrained dark portfolio with prominent typography and motion; listing description | Use only typographic restraint and visual hierarchy, not creative assets |
| Land-book | https://land-book.com/overmind_design | Editorial / visual-identity-oriented Polish designer portfolio | Use identity-led display typography as inspiration, not site code |
| Land-book | https://land-book.com/motion | Motion-filtered website showcase, some premium filters | Use as discovery only; no claim of a particular interaction without viewing it |
| MotionSites AI | https://motionsites.ai/sections?prompt=axion-about | Public section catalog, e.g. editorial, CTA and component patterns | Consider restrained card feedback; no copied prompt/content |
| MotionSites AI | https://motionsites.ai/?prompt=rivr-hero | Hero section listing in public gallery | Contrast / transition study only; avoid decorative heavy hero animation |
| MotionSites AI | https://motionsites.ai/?prompt=securify-hero | Public landing/hero listings | Reject generic SaaS graphics and irrelevant gradient/glow motifs |

Actual animation behavior and exact hover implementation at originals: **NOT TESTED**.
MotionSites is an inspiration/prompt catalog, not Motion.dev API/library.
Copyright/license for individual content: **not verified**; use existing
SalonBW assets only. Gallery inclusion is not conversion evidence.

## Two concepts

**A Editorial Premium.** Monochrome split hero, Playfair display headline,
actual salon photograph, service discovery, gallery and testimonials.
One primary action: \`Umów wizytę\`. Best for brand recognition and trust.
Tradeoff: more storytelling before deeper booking exploration.

**B Booking First.** Clear appointment copy, existing nearest-slot API teaser,
links to the actual catalog, a numbered explanation of the booking flow, and
the same authenticated booking modal. Best for mobile task clarity.
Tradeoff: less photographic storytelling in the first viewport.

**Baseline.** Read-only composition of the existing hero, services,
testimonials and CTA components; original homepage remains at \`/\`.

## Implementation

- \`/design-lab\` controlled by \`getServerSideProps\` and
  \`process.env.APP_ENV === 'development'\`. Hosted development runs
  \`NODE_ENV=production\`, which is intentionally NOT a lab gate.
- Full page returns 404 for any other APP_ENV. The same bundle contains the
  page route, but the server must not render it for production visitors.
- \`<meta name="robots" content="noindex, nofollow, noarchive"/>\` in dev,
  plus the existing dev gateway Basic Auth and global noindex.
- Tab-like **buttons with aria-pressed**, native keyboard support, status
  announcer, and no new libraries. No storage, dynamic secrets or live writes.
- Buttons keep the existing \`BookingModal\`, preserving login/register
  routes and service choices; category links go to the real \`/services\`.
- \`NearestSlotTeaser\` shows actual public slot information or hides itself.
  No invented date, review, price or availability.
- 390/850/1440 responsive breakpoints with CSS Module using existing brand
  tokens; \`prefers-reduced-motion\` removes image hover transform.

## Release checklist

| Gate | Status in current draft |
| --- | --- |
| Explicit server-side production 404 | Coded + Jest regression added; CI pending |
| Variant selection / booking CTA | Coded + Jest regression added; CI pending |
| PL/EN/DE labels | All lab-specific strings included |
| Preserve base homepage/SEO/CRM | No changes outside newly added lab files |
| Brand/silver contrast | Uses approved tokens; actual browser check pending |
| Lint / Jest / typecheck / Next build | CI pending; do not infer pass |
| Desktop/mobile screenshots | NOT TESTED |
| Keyboard/reduced motion in browser | NOT TESTED |
| Hosted dev deployment | NOT DEPLOYED |
| Production rollout | NOT AUTHORIZED |

Do not make the lab page public or claim performance/accessibility gains
without instrumentation. Select a winner after a real device walkthrough;
then change \`/index.tsx\` separately with its own regression tests and GO.
