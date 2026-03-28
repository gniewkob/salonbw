# Bootstrap 5 Migration — Design Spec

Date: 2026-03-27
Status: **approved**

## Goal

Migrate SalonBW panel from hybrid Tailwind + Versum vendor CSS to **Bootstrap 5** as the single styling foundation. Clean, scalable codebase where Versum dump HTML can be copied with minimal class renames. Remove all "Versum" naming from codebase — this is SalonBW.

## Target Architecture

```
apps/panel/src/styles/
├── globals.css          ← Bootstrap 5 import + body/root vars (no Tailwind)
├── salon-shell.css      ← layout shell (topbar, mainnav, sidenav, page-content)
└── salon-theme.css      ← ~300 lines: .btn-salon, .box, .info-box, .tree, sprites, SalonBW colors

apps/panel/src/components/
├── salon/               ← renamed from versum/
│   ├── SalonShell.tsx
│   ├── SalonSecondaryNav.tsx
│   ├── SalonSvgSprites.tsx
│   └── navs/
└── ui/
    ├── PanelTable.tsx   ← thin wrapper → <table class="table table-bordered">
    └── PanelSection.tsx ← thin wrapper → <div class="salon-section">
```

### CSS Loading in `_app.tsx`

```tsx
import 'bootstrap/dist/css/bootstrap.min.css';  // Bootstrap 5 (~22KB gzip)
import '@/styles/salon-theme.css';                // SalonBW overrides (~5-10KB)
import '@/styles/salon-shell.css';                // Shell layout
```

## What Gets Installed

- `bootstrap@^5.3` via npm/pnpm

## What Gets Removed

- `tailwindcss`, `@tailwindcss/postcss` from dependencies
- `tailwind.config.ts`
- PostCSS tailwind plugin config
- `public/versum-vendor/` directory (~1.1MB of vendor CSS)
- `public/salonbw-vendor/` directory (if exists)
- `SalonBWVendorCss.tsx` component + imports from 8 pages
- All 172x `@apply` directives from `globals.css`

## `salon-theme.css` — Custom Classes (~300 lines)

Only classes Bootstrap 5 does NOT cover natively:

- **Buttons:** `.btn-salon` (teal brand color), `.button-blue` compat alias
- **Boxes:** `.box`, `.info-box`, `.box-title`, `.bottom-link`
- **Sections:** `.salon-section` (renamed from `.edit_branch_form`)
- **Layout:** `.salon-column-row` (renamed from `.column_row`)
- **Icons:** `.icon.sprite-*` positions (extracted from `Icon.css` + `responsive.css`)
- **Tree nav:** `.tree`, `.root`, `.standard_group` (sidebar groups)
- **Colors:** CSS vars `--salon-accent: #008bb4`, `--salon-brand: #25B4C1`

**NOT ported (Bootstrap 5 native):**
- Spacing: `m-xs`/`p-m` → Bootstrap `m-1`..`m-5`, `p-1`..`p-5`
- Tables: `.table`, `.table-bordered`, `.table-striped`
- Forms: `.form-control`, `.form-group`
- Lists: `.list-group`, `.list-group-item`
- Grid: `row`, `col-*`
- Colors: `.text-success`, `.text-primary`, `.text-danger`
- Modals: `.modal`, `.modal-dialog`, etc.

## Tailwind → Bootstrap 5 Class Translation

| Tailwind | Bootstrap 5 |
|----------|-------------|
| `flex` | `d-flex` |
| `flex-col` | `flex-column` |
| `items-center` | `align-items-center` |
| `justify-between` | `justify-content-between` |
| `gap-2` | `gap-2` |
| `w-full` | `w-100` |
| `p-3`, `px-4`, `mt-2` | `p-3`, `px-4`, `mt-2` |
| `text-sm` | `small` / `fs-6` |
| `text-center` | `text-center` |
| `bg-gray-50` | `bg-light` |
| `rounded` | `rounded` |
| `border` | `border` |
| `hidden` | `d-none` |
| `grid grid-cols-2` | `row` + `col-6` |
| `hover:bg-gray-100` | CSS hover in theme |

## Module Migration Order

1. **Shell** (`_app.tsx`, layout components) — foundation
2. **Klienci** (already partly Bootstrap via vendor CSS) — least work
3. **Magazyn** (same as above)
4. **Uslugi** — rewrite from Tailwind
5. **Statystyki** — rewrite (heaviest Tailwind usage: worktime 64, register 41 occurrences)
6. **Lacznosc** — rewrite from Tailwind
7. **Ustawienia** — already on PanelSection/PanelTable, light rename
8. **Reszta** (auth, admin, dashboard)

## File Renames ("Versum" → "Salon/SalonBW")

| Current | Target |
|---------|--------|
| `salonbw-shell.css` | `salon-shell.css` |
| `VersumShell.tsx` | `SalonShell.tsx` |
| `VersumSecondaryNav.tsx` | `SalonSecondaryNav.tsx` |
| `SalonBWVendorCss.tsx` | **deleted** |
| `SalonBWSvgSprites.tsx` | `SalonSvgSprites.tsx` |
| `components/versum/` | `components/salon/` |
| `versum-vendor/` | **deleted** |
| `salonbw-vendor/` | **deleted** |

**Kept as "Versum":** docs about the cloning process (`VERSUM_CLONING_STANDARD.md`, `VERSUM_CLONE_PROGRESS.md`) — refers to the source system, not our code.

## PanelTable / PanelSection

Kept as thin wrappers over Bootstrap classes:
- `PanelTable` → renders `<table class="table table-bordered">`
- `PanelSection` → renders `<div class="salon-section">` with `<h2>` and actions

## Risks

- **Visual regressions** — each module needs smoke test post-migration
- **Tailwind classes without Bootstrap equivalent** (e.g. `hover:` variants) — add to `salon-theme.css`
- **Sprite icons** — depend on sprite sheet positions; must port exactly
- **72 files** — mechanical but high volume; risk of missed classes

## Definition of Done

- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm eslint src --fix` clean
- [ ] Zero Tailwind imports in code
- [ ] Zero vendor CSS files
- [ ] `tailwindcss` removed from package.json
- [ ] All "Versum" renamed to "Salon" in component/file names
- [ ] Each module visually works (smoke test)
- [ ] Build succeeds (`next build`)
