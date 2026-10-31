# SalonBW — Landing Design Direction 1.0

**Status:** WDI design decision and comparison prototype; no approval of production release.  
**Source baseline:** L3 PR [#1583](https://github.com/gniewkob/salonbw/pull/1583), SHA `9a55537fde61465a8dbf9fe0ec2f1e55ddb81a7d`  
**Date:** 2026-10-31  
**Audience:** Clients looking for a known service, clients comparing variants, clients unsure of the right treatment.  
**Business task:** From service discovery to a correct booking action using the existing authenticated panel wizard. No invented prices or availability.

## Brand promise and primary action

Black & White — premium, calm, trustworthy hair artistry with **transparent, catalog-backed services and booking**. One primary CTA concept: **Umów wizytę**. Marketing browsing remains accessible without logging in; the booking step retains current auth and API contracts.

## Three genuinely different prototypes

1. **A · Editorial:** Black immersive opening, large Playfair type, salon narrative, single-column service list. Strongest distinctive brand language. Risk: longer path to first price.
2. **B · Price-first:** Light editorial opening, desktop category sidebar and compact comparison rows, mobile horizontal filter bar. Favors price/variant clarity and quick booking. Risk: must not become a generic booking dashboard.
3. **C · Discovery:** Short centered introduction and card-grid services with persistent price action. More visual discovery, but duplicates action chrome and increases vertical card height.

**Chosen direction for implementation:** A's restrained brand treatment for **homepage hero**, B's information architecture for **/services**. C remains an **experiment only**; no additional npm/UI/3D dependencies.

These are design hypotheses, **not** measured A/B tests. Real user testing could overturn the preference.

## Protected elements (must not regress)

- L1 deep links `?offer=hairdressing|care|extensions` and manual category switching.
- L2 `GET /services/public` price, duration, `onlineBooking` and nested variant rules.
- L3 44px minimum touch targets, grid reflow and `details/summary` keyboard use.
- `BookingModal`: preserve existing login/redirect to panel `/booking?serviceId=...`; **never** pass nested `ServiceVariant.id` as a service id.
- PL/EN/DE catalog and UI strings, SEO metadata/schema, first-party analytics, legal pages, no extra notifications or payments.
- Existing `apps/landing/src/styles/globals.css` design tokens and `.claude/skills/salonbw-brand/SKILL.md`.

## Design tokens and component contract

| Element | Token / principle | Responsive behavior |
| --- | --- | --- |
| Headlines | Playfair Display, weight 700, readable line length | `clamp()`, no text overflow at 320px |
| UI copy | Open Sans, 16px minimum normal mobile body copy | 1.5–1.8 line height |
| Palette | `--brand-black`, `--brand-white`, `--brand-silver`, existing `--brand-warm-*` | Black/white editorial bands; no gold/purple |
| Buttons | `.btn-silver` / black text on silver; existing outlined CTAs where appropriate | ≥44px touch, clear focus-visible, no hover-only affordance |
| Categories | Sidebar for desktop with active `aria-pressed`; native horizontal buttons on mobile | No reliance on scrollbar for all access; all labels keyboard reachable |
| Variants | Semantic `details/summary` and readable price/time rows | Reflows on 320/390; no nested interactive descendants in `summary` |
| Motion | Subtle 150–300ms user-initiated feedback only | `prefers-reduced-motion`; no hidden initial content or marquee |
| Media | Existing licensed first-party salon photography; original logo | Explicit sizes/aspect, no copied salon imagery |

## End-to-end page blueprint

**Homepage:** Existing Navbar → cleaner split Hero (brand and booking) → three catalog-backed service entry cards → About (actual founder info) → own gallery → verified testimonials → booking CTA → Contact. No extra standalone ticker/testimonial strip.

**/services:** Short branded header + existing general booking → category navigation → service list (price + duration + variant disclosure) → optional established per-service `BookingModal` → existing final booking CTA. Desktop category navigation lives in a **left sidebar**; mobile category navigation remains **horizontal chips**.

**Modal/panel:** no redesign in this scope, but test dialog focus/ESC and exact link to panel booking, including nested variant fallback.

## Conversion hypotheses and measurement design (no baselines fabricated)

| Hypothesis | Instrumentation to review/extend | Success metric / guardrail |
| --- | --- | --- |
| Category sidebar makes services easier to find | Existing `view_item_list`, `select_item`, proposed `select_service_category` event (not shipped without analytics review) | Share of service views leading to a booking initiation; don't claim uplift without matched cohort |
| Prices + time in first visual row reduce uncertainty | `details` open interaction, booking modal open and auth redirect; ensure existing event semantics | Catalog-to-booking initiation completion, not clicks alone |
| Reduced hero height exposes relevant services sooner | Viewport-specific before/after screens; service section visibility / Core Web Vitals | Better findability with stable LCP/CLS and no accessibility regression |

## Decisions explicitly held

- No actual new prices, "consultation required" label, discounts, available time claims, claims about salons/stylists, fake reviews or borrowed images.
- No ThreeUI/WebGL, additional animation or UI dependency: no demonstrated benefit relative to cost.
- No production deploy/merge or forced closure of separate security PR #1576.
- Do not use standalone HTML prototype as a substitute for hosted DEV UAT.

## Implementation increment — Editorial homepage hero (L5)

The first Editorial-A homepage change is implemented in `SplitHero.tsx` and `globals.css` on the L5 stacked branch. The heading and salon photo remain the brand anchors; decoration is reduced, native content has no delayed-visibility animation, CTAs use 48px targets and the text/image panels reflow according to content rather than rigid `100svh`. The original service discovery and `BookingModal` paths remain intact. **This is a candidate implementation, not a production or hosted-DEV visual acceptance**. Details: [L5 handoff](../../journal/2026-10-31-wdi-editorial-hero-l5.md).

## Acceptance before any merge/deployment

1. Local unit/integration tests, lint, typecheck and real Next build **for exact candidate SHA**.
2. Real browser screenshots 320/390/768/1440px on the built site with real/synthetic isolated API; keyboard/focus, screen-reader smoke, modal, broken service category and error state.
3. Actual hosted DEV catalog `GET /services/public`; verify flat/nested active/offline variants, price types, booking routing, PL/EN/DE long copy.
4. Accessibility/contrast and Lighthouse run with measurement environment recorded; do not claim WCAG or performance score without run.
5. Review L1 → L2 → L3 dependency stack and independently remediate high dependencies in #1576. No PROD release without explicit owner approval.
