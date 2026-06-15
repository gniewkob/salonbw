# Salon Black & White — Portable Brand Brief

Self-contained, copy-paste brand spec for **external tools** (ChatGPT Custom
GPT / Projects / Custom Instructions, Gemini, Midjourney prompts, designers).
It mirrors the in-repo skill `.claude/skills/salonbw-brand/SKILL.md` — that
file stays the single source of truth; update both together if the brand changes.

> Brand essence: the salon's interior is black, white and shades of gray — the
> brand mirrors it. Elegant, editorial, monochrome. "Luxury print magazine",
> not "colorful SaaS". When in doubt: less color, more whitespace, stronger type.

---

## How to use this file

- **Custom GPT (best):** Create → Configure → upload this file as *Knowledge*;
  Instructions: "Always design and write per the attached Salon Black & White
  brand brief; use only approved tokens, never ad-hoc colors."
- **ChatGPT Projects:** attach this file + paste the one-liner above as project
  instructions.
- **Custom Instructions (char-limited):** paste only the "CONDENSED" block below.
- **One-off chat:** paste the full brief, then ask for the artifact.
- Ask for output as **HTML/CSS** (or Canvas/slides) so the tokens actually apply.

---

## FULL BRAND BRIEF

### Color tokens — the only palette
Black, white, grays. **No other hues** (no blue, purple, gold). Accent = silver.

| Token | Hex | Role |
|---|---|---|
| Black | `#0d0d0d` | dark section backgrounds; primary text on light |
| Deep black | `#080808` | full-bleed hero / login backgrounds |
| Silver | `#b4b8be` | DECORATIVE only: borders, dividers, icons ≥3px, large display type, dot indicators, accents |
| Silver dark | `#8e9298` | hover state of silver surfaces/buttons |
| Silver ink | `#6e7278` | silver-toned TEXT on white/light (4.84:1 — AA) |
| White | `#ffffff` | light backgrounds; text on dark |

### Contrast — non-negotiable, pre-computed (WCAG)
- Silver `#b4b8be` on white = **1.99:1 → never use silver for text on light**.
  Use silver-ink `#6e7278` (4.84:1) instead.
- Dark text `#0d0d0d` on silver = 9.76:1 → **buttons/accents are dark-on-silver,
  never white-on-silver** (white on silver fails at 1.99:1).
- White text on black: minimum `rgba(255,255,255,0.45)` (4.52:1); standard muted
  body = `0.55` alpha (6.25:1). Below 0.45 = decoration, not text.
- Target: WCAG AA everywhere (≥4.5:1 small text, ≥3:1 large). Compute before shipping.

### Typography
- **Headings / display:** Playfair Display (serif), weight 700 for H1/H2; italic
  for the ampersand "&" and emphasis (the ampersand is a brand signature — may be
  oversized, silver, decorative).
- **Body / UI:** Open Sans, 400 body / 600–700 labels.
- **Label style** (eyebrows, CTAs, nav, section kickers): UPPERCASE,
  `letter-spacing 0.1–0.2em`, small size (0.65–0.75rem), weight 600–700. This
  wide-tracked micro-type is a core brand signature.
- Body ≥16px on mobile; line-height 1.5–1.8.
- Copy language: Polish (PL) for the salon's audience; EN/DE only where the brand
  already runs multilingual.

### Buttons & CTAs
- **Primary:** silver `#b4b8be` background, **dark text `#0d0d0d`**, uppercase,
  tracked, `border-radius 1–2px` (near-square corners are intentional), hover →
  silver-dark `#8e9298`.
- **Secondary on dark:** 1px `rgba(255,255,255,0.3)` border, text
  `rgba(255,255,255,0.75)`, hover → silver border + silver text.
- One primary CTA concept per page ("Umów wizytę"); repeat at most 3×.
- Touch targets ≥44×44px (pad the hit area if the visual is smaller).

### Surfaces, effects, decoration (sparingly, ≤2 per viewport)
- Sections alternate dark (`#0d0d0d`) and light (white) bands.
- Approved decoration: film-grain overlay 4–5% opacity; oversized "B&W" watermark
  at `rgba(255,255,255,0.04–0.08)`; 1px silver offset frame behind images; subtle
  grayscale filter on photos/media.
- Shadows: large soft only (`0 8px 20px rgba(0,0,0,0.18)`); no colored glows.
- **No gradients** except black-to-transparent scrims over photos.

### Motion
- Micro-interactions 150–300ms ease-out; entrances `fadeUp` ≤900ms.
- Content must be readable without JS and before any reveal animation (never hold
  content at `opacity:0` as the initial state).
- **No infinite marquees/tickers.** Always honor `prefers-reduced-motion`.

### Layout / composition
- Minimal, generous whitespace, editorial rhythm. Home pages: ≤7 sections.
- Cohesion: landing and panel share the same tokens (silver `#b4b8be`, black
  `#0d0d0d`, Playfair + Open Sans, silver-bg/dark-text buttons, "B&W" watermark,
  uppercase tracked eyebrows).

### Hard anti-patterns (each caused a real shipped bug)
- White text on a silver background.
- Raw `#b4b8be` silver as text color on light backgrounds.
- White-alpha text below 0.45 on dark backgrounds.
- Content hidden at `opacity:0` until a scroll/JS event fires.
- Interactive elements smaller than 24px without a padded hit area.
- New accent hues (purple/gold/blue) — silver is the only accent.
- Emoji used as icons — use clean line/SVG icons.
- Script/handwriting display fonts — only Playfair + Open Sans.

---

## DOCUMENTS bridge (offers, price lists, slides, e-mails, PDFs)

The rules above are UI-first. For documents, translate them:
- Palette only: black `#0d0d0d`, white, grays; accent silver `#b4b8be`. No other colors.
- Headings: Playfair Display 700. Body: Open Sans 400 / 600 labels.
- Kickers/labels/section titles: UPPERCASE, letter-spacing 0.1–0.2em, small.
- Generous whitespace; premium-magazine layout, not a colorful template.
- Contrast ≥4.5:1: silver is not body text on white (use `#6e7278`); on silver,
  text is dark `#0d0d0d`, never white.
- Accent blocks/buttons: silver fill + dark text, near-square corners (radius 1–2px).
- No emoji icons, no gradients (except black→transparent over photos), no script fonts.
- Prefer delivering as HTML/CSS (or Canvas/slides) so these tokens render exactly.

---

## CONDENSED (paste into ChatGPT Custom Instructions — ≤1500 chars)

```
Brand: Salon Black & White — elegant, editorial, MONOCHROME (luxury print, not colorful SaaS). Palette ONLY: black #0d0d0d, white #fff, grays; accent = silver #b4b8be (decorative). No other hues (no blue/purple/gold). Silver-toned text on light = #6e7278 (never raw #b4b8be on white). On silver, text is dark #0d0d0d, never white. White text on black ≥ rgba(255,255,255,0.55). All contrast ≥4.5:1.
Type: headings Playfair Display 700 (serif); body/UI Open Sans 400, labels 600. Labels/kickers/section titles UPPERCASE, letter-spacing 0.1–0.2em, small. Body ≥16px.
Buttons/accents: silver bg + dark text #0d0d0d, near-square corners (radius 1–2px), hover #8e9298.
Layout: lots of whitespace, alternating dark/light bands, ≤7 sections, one primary CTA.
Decoration (sparingly): film grain 4–5%, oversized "B&W" watermark, 1px silver frames, grayscale photos, soft shadows. No gradients (except black→transparent over photos). No infinite marquees; honor reduced-motion.
NEVER: white on silver, silver as body text on white, emoji as icons, script fonts, new accent colors.
Deliver documents as HTML/CSS (or Canvas/slides) using these tokens. Copy in Polish unless asked otherwise.
```
