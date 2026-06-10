---
name: salonbw-brand
description: Salon Black & White brand design system — colors, typography, contrast-safe tokens, layout and motion rules for the landing (dev.salon-bw.pl / salon-bw.pl) and panel (panel.salon-bw.pl). Use this skill whenever designing, building, restyling, or reviewing ANY user-facing UI in apps/landing or apps/panel — new sections, components, pages, CTAs, color choices, hover/focus states, animations — even if the user doesn't mention "brand" explicitly. Also use it when picking a color, font size, or spacing value, so the choice lands on an approved token instead of an ad-hoc hex.
---

# Salon Black & White — Brand Design System

The salon's physical interior is black, white, and shades of gray — the digital
brand mirrors it. Elegant, editorial, monochrome. Think "luxury print magazine",
not "colorful SaaS". When in doubt: less color, more whitespace, stronger type.

## Identity

- **Logo:** `apps/landing/public/images/logo.svg` (vector, B&W silhouette;
  scale freely, never recolor, never add drop shadows). On dark backgrounds
  use it white; on light backgrounds black.
- **Name in copy:** "Black & White" / "Salon Black & White"; sub-brand line
  "Akademia Zdrowych Włosów". The ampersand is a brand signature — Playfair
  italic, silver, may be oversized as a decorative element.
- **Language:** all user-facing copy in Polish (panel is Polish-only by
  project rule).

## Color tokens — the only palette

Black, white, grays. Do not introduce new hues (no blues, purples, golds);
accent = silver. All tokens live in `apps/landing/src/styles/globals.css`
(landing) and `apps/panel/src/styles/salon-shell.css` / `salon-theme.css`
(panel).

| Token | Value | Role |
|---|---|---|
| `--brand-black` | `#0d0d0d` | dark section backgrounds, primary text on light |
| hero deep black | `#080808` | full-bleed hero/login backgrounds |
| `--brand-silver` | `#b4b8be` | DECORATIVE only: borders, dividers, icons ≥3px, large display type, dot indicators |
| `--brand-silver-dark` | `#8e9298` | hover state of silver surfaces |
| `--brand-silver-ink` | `#6e7278` | silver-toned TEXT on white/light (4.84:1) |
| white | `#ffffff` | light backgrounds, text on dark |

**Warm-cream sub-palette** (`--brand-warm-*`: ink/soft/muted/label on
`#faf9f7` cream) exists on the landing for light editorial sections. It is
legacy-approved: keep it where it already is, but for NEW sections prefer
the neutral gray scale above — the owner's direction is black/white/gray to
match the salon interior.

## Contrast — non-negotiable, pre-computed

These were measured (WCAG relative luminance) and shipped; reuse instead of
recomputing or guessing:

- `#b4b8be` silver on white = **1.99:1 → never use silver for text on light**.
  Use `--brand-silver-ink` (#6e7278, 4.84:1) instead.
- Dark text `#0d0d0d` on silver bg = 9.76:1 → **buttons on silver are
  dark-on-silver, never white-on-silver** (white fails at 1.99:1).
- White-alpha text on `--brand-black`: minimum `rgba(255,255,255,0.45)`
  (4.52:1, borderline); standard muted = **`0.55` alpha (6.25:1)**. Anything
  below 0.45 is decoration, not text.
- `--brand-warm-label` is `#7a6a58` (4.95:1 on cream) — its old value
  `#b0a090` failed AA; do not revert.
- Target: Lighthouse accessibility **100** on every public page. That is the
  shipped baseline (2026-06-10); regressions are bugs.

## Typography

- **Display/headings:** Playfair Display (serif), weight 700 for H1/H2,
  italic for the ampersand and emphasis. Loaded via `next/font` in
  `apps/landing/src/lib/fonts.ts` (`--font-playfair`).
- **Body/UI:** Open Sans (`--font-open-sans`), 400 body / 600–700 labels.
- **Label style** (eyebrows, CTAs, nav): uppercase, `letter-spacing`
  0.1–0.2em, sizes 0.65–0.75rem, weight 600–700. This wide-tracked micro
  type is a core brand signature.
- Body ≥16px on mobile (iOS zoom), line-height 1.5–1.8.
- Panel legacy note: Versum-clone modules use Lato in some breadcrumbs —
  don't propagate Lato into new work.

## Buttons & CTAs

- Primary: silver background, **dark text** (`#0d0d0d`), uppercase, tracked,
  `border-radius` 1–2px (near-square corners are intentional), hover →
  `--brand-silver-dark`. Classes: `.btn-silver` / `.split-hero__cta-primary`.
- Secondary on dark: 1px `rgba(255,255,255,0.3)` border, text
  `rgba(255,255,255,0.75)`, hover → silver border + silver text.
- One primary CTA concept per page ("Umów wizytę"); on a long-scroll landing
  repeat it at most 3 times (hero, pre-footer CTA band, mobile FAB). More
  entry points dilute, not multiply, conversion.
- Touch targets ≥44×44px (visual element may be smaller — pad the hit area;
  see slider dots pattern: visual dot in inner `<span aria-hidden>`, padded
  `<button>` around it).

## Surfaces, effects, decoration

- Sections alternate dark (`#0d0d0d`) and light (white/cream) bands.
- Approved decorative effects (use sparingly, max ~2 per viewport):
  film-grain overlay at 4–5% opacity, oversized "B&W" watermark at
  `rgba(255,255,255,0.04–0.08)`, 1px silver offset frames behind images,
  subtle grayscale filter on embedded media.
- Shadows: large soft only (`0 8px 20px rgba(0,0,0,0.18)`); no colored glows.
- No gradients except black-to-transparent scrims over photos.

## Motion

- Micro-interactions 150–300ms ease-out; entrances `fadeUp` ≤900ms.
- **Content must be readable without JS and before any reveal animation** —
  reveal-on-scroll may animate transform, but never hold content at
  `opacity: 0` as initial state (this shipped as blank-section bug; CSS
  scroll-driven animations with visible fallback are the approved pattern).
- No infinite marquees/tickers — flagged as decorative-motion anti-pattern
  in the 2026-06 UX audit.
- Always honor `prefers-reduced-motion` (global safety net exists in panel
  CSS; landing components must check it too).

## Page composition (landing)

Recommended pattern (UX audit 2026-06): minimal single column, generous
whitespace, ≤7 sections on the home page:
Hero → Services (3 highlights max) → one social-proof strip + testimonials →
About (short) → Gallery teaser → CTA band → Contact/footer.
Resist adding new strips/tickers/stat bars — consolidate into existing
sections instead.

## Hard anti-patterns (each caused a real shipped bug)

- White text on silver background (failed WCAG, shipped, fixed 2026-06-10).
- Raw `#b4b8be` as text color on light backgrounds.
- White-alpha text below 0.45 on dark backgrounds.
- Content hidden at `opacity: 0` until IntersectionObserver fires.
- Interactive elements smaller than 24px without padded hit area.
- New accent hues (purple `#8b5cf6` fallbacks were purged in 2026-06 — don't
  reintroduce).
- Emoji as icons — use Heroicons outline (panel standard, registered in
  `SalonIconRegistry.ts`).

## Verification ritual (before claiming done)

1. `pnpm eslint src --fix` + `pnpm tsc --noEmit` in the touched app.
2. Screenshot desktop + 390px mobile (Playwright/chrome-devtools).
3. Lighthouse accessibility on the touched page — must stay 100.
4. Check new text colors against the contrast table above; if a pairing
   isn't listed, compute WCAG ratio before shipping (≥4.5:1 small text,
   ≥3:1 large).
