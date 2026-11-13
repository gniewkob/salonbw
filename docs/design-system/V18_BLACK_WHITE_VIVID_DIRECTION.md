# Studio V18 — Black & White + Vivid Colors

**Decision (owner, 2026-11-13):** SalonBW panel Studio V18 retains a black-and-white visual foundation with **visible, saturated functional colors**. The previously explored lavender/pastel palette is superseded. This decision applies to the **whole Studio V18 panel**, including the dashboard, calendar, appointment drawer, CRM and operational modules. It does not authorize changes to the public site or production.

## Product boundaries

- **Panel V18:** black, white and neutral grays for navigation, surfaces, controls and text. Use strong colors purposefully for status, selection, accessibility focus and key data signifiers. Avoid large pastel-filled cards.
- **Landing:** 03 / Swiss Atelier and 04 / Immersive Experience remain the two shortlisted directions. No final landing selection or implementation approval is implied here.
- **Booking:** existing protected API rules, concurrent visits, staff permissions, time blocks, consent, single-stylist behavior and client acceptance are unaffected.
- **Production:** temporary booking/login restrictions and all production releases are out of scope. Only isolated DEV promotion after gates.

## Proposed implementation palette (requires owner visual UAT)

| Purpose | CSS token | Value | Application |
|---|---|---|---|
| Canvas | `--v18-canvas` | `#fafafa` | Neutral workspace |
| Paper | `--v18-paper` | `#ffffff` | Cards, forms and calendar |
| Ink | `--v18-ink` | `#101012` | Primary text / black CTA |
| Muted text | `--v18-secondary` | `#525252` | Secondary text |
| Hairline | `--v18-line` | `#dedede` | Dividers |
| Focus / selection | `--v18-focus` | `#7c3aed` | Focus ring / selection / current-time line |
| Confirmed | `--v18-status-confirmed` | `#16a34a` | Green marker |
| In progress / scheduled | `--v18-status-progress` | `#2563eb` | Cobalt marker |
| Online pending | `--v18-status-pending` | `#f97316` | Orange marker |
| Reschedule pending | `--v18-status-rescheduled` | `#db2777` | Fuchsia marker |
| Completed | `--v18-status-completed` | `#52525b` | Charcoal marker |
| Cancelled | `--v18-status-cancelled` | `#737373` | Gray marker |
| No-show | `--v18-status-no-show` | `#dc2626` | Red marker |

The owner palette also includes fuchsia `#db2777`, orange `#f97316`, green `#16a34a` and red `#dc2626`. Existing darker semantic variants remain where needed for readable text; color alone must not convey status.

Vivid-color surfaces in the Studio dashboard use darker, saturated hues with light text. Appointment cards use **white backgrounds and colored side markers**, not light-tinted status backgrounds. Non-color cues (solid, dashed, dotted and double borders plus explicit status labels) remain important.

## Source of truth and migration

- `apps/panel/src/styles/V18Foundation.module.css` defines shared panel tokens (legacy V18 child components inherit them through the Studio root).
- `apps/panel/src/styles/StudioV18.module.css` defines the dashboard entry's matched tokens.
- `apps/panel/src/styles/V18Calendar.module.css` maps appointment states to strong semantic markers.
- `apps/panel/src/styles/V18BookingDrawer.module.css`, `V18Select.module.css` and `V18DateInput.module.css` use the same neutral actions and Inter type.
- Legacy `--v18-lavender` / `--v18-lilac` / `--v18-blush` / `--v18-sage` are **compatibility aliases now mapped to neutral grays**, not a design direction. Remove only after finding all consumers.
- Preserve non-visual behavior and allow only DEV-only style-scope changes. Do not change the public landing CSS, legacy calendar, backend scheduling or role logic for this design revision.

## Definition of done

1. Design contract test: no literal pastels and stable core tokens; textual contrast for main controls.
2. Exact-SHA component/unit tests, typecheck, formatting, lint and production build on isolated workspace.
3. Full-stack browser regression: desktop and 390px mobile; single stylist; three parallel appointments; rescheduling confirmation; distinct high-visibility status markers; drawer and date/select controls.
4. Independent review including contrast, keyboard focus and labels; in particular WCAG 2.2 [1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color) and [1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) are **project evaluation criteria**, not claims of blanket conformance.
5. Hosted DEV API/panel compatibility check, visual comparison and Ola's visual acceptance. No production deploy under this change.

**Release status:** source proposal / Draft, not a verified or deployed DEV/PROD release. GitHub Actions runner startup issues are distinct from test results.
