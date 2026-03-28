# Bootstrap 5 Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hybrid Tailwind + Versum vendor CSS with Bootstrap 5 + lean `salon-theme.css` as the single styling foundation. Rename all "Versum" component/file references to "Salon".

**Architecture:** Bootstrap 5 loaded globally in `_app.tsx`. Custom SalonBW-specific classes in `salon-theme.css` (~300 lines). Shell layout in `salon-shell.css` (cleaned from current `salonbw-shell.css`). All `components/salonbw/` renamed to `components/salon/`.

**Tech Stack:** Bootstrap 5.3, Next.js 15.5.10, pnpm, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-27-bootstrap5-migration-design.md`

---

## File Structure

### New files
- `apps/panel/src/styles/salon-theme.css` — SalonBW custom classes not covered by Bootstrap 5

### Renamed files
- `apps/panel/src/styles/salonbw-shell.css` → `apps/panel/src/styles/salon-shell.css`
- `apps/panel/src/components/salonbw/` → `apps/panel/src/components/salon/`
  - `SalonBWShell.tsx` → `SalonShell.tsx`
  - `SalonBWSecondaryNav.tsx` → `SalonSecondaryNav.tsx`
  - `SalonBWSvgSprites.tsx` → `SalonSvgSprites.tsx`
  - `SalonBWTopbar.tsx` → `SalonTopbar.tsx`
  - `SalonBWMainNav.tsx` → `SalonMainNav.tsx`
  - `SalonBWIcon.tsx` → `SalonIcon.tsx`
  - `SalonBWListNav.tsx` (in navs/) → `SalonListNav.tsx`
  - `VersumBreadcrumbs.tsx` → `SalonBreadcrumbs.tsx`
  - `navigation.ts` stays (generic name OK)

### Deleted files
- `apps/panel/src/components/salonbw/SalonBWVendorCss.tsx`
- `apps/panel/public/versum-vendor/` (entire directory)
- `apps/panel/tailwind.config.ts`

### Modified files
- `apps/panel/package.json` — add bootstrap, remove tailwindcss deps
- `apps/panel/postcss.config.mjs` — remove tailwind plugin
- `apps/panel/src/styles/globals.css` — rewrite: remove @import tailwindcss, remove all @apply, keep plain CSS
- `apps/panel/src/pages/_app.tsx` — update imports
- `apps/panel/src/components/ui/PanelSection.tsx` — rename class `edit_branch_form` → `salon-section`
- 66 page files — update `SalonBWShell`→`SalonShell`, `VersumBreadcrumbs`→`SalonBreadcrumbs` imports
- 8 page files — remove `SalonBWVendorCss` import/usage
- 72 page files — Tailwind class → Bootstrap 5 class migration

---

## Task 1: Install Bootstrap 5, remove Tailwind deps

**Files:**
- Modify: `apps/panel/package.json`
- Modify: `apps/panel/postcss.config.mjs`
- Delete: `apps/panel/tailwind.config.ts`

- [ ] **Step 1: Install Bootstrap 5**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm add bootstrap@^5.3
```

- [ ] **Step 2: Remove Tailwind dependencies**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm remove tailwindcss @tailwindcss/postcss
```

- [ ] **Step 3: Update PostCSS config — remove Tailwind plugin**

Replace `apps/panel/postcss.config.mjs` with:

```js
export default {
  plugins: {
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Delete Tailwind config**

```bash
rm apps/panel/tailwind.config.ts
```

- [ ] **Step 5: Verify pnpm install succeeds**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm install
```

Expected: clean install, no tailwind references in node_modules/.modules.yaml lockfile entry

- [ ] **Step 6: Commit**

```bash
cd /Users/gniewkob/Repos/salonbw && git add apps/panel/package.json apps/panel/pnpm-lock.yaml apps/panel/postcss.config.mjs && git rm apps/panel/tailwind.config.ts
git commit -m "chore(panel): install bootstrap 5, remove tailwindcss deps"
```

---

## Task 2: Create `salon-theme.css`

**Files:**
- Create: `apps/panel/src/styles/salon-theme.css`

Extract only the custom SalonBW classes that Bootstrap 5 does not provide natively. Source: current `globals.css` @apply blocks + `salonbw-shell.css` + vendor CSS `Icon.css`.

- [ ] **Step 1: Create `salon-theme.css`**

Write `apps/panel/src/styles/salon-theme.css` with the following content (plain CSS, no @apply):

```css
/* =============================================
   SalonBW Theme — custom classes over Bootstrap 5
   Only classes Bootstrap does NOT cover natively.
   ============================================= */

/* --- CSS Variables --- */
:root {
  --salon-accent: #008bb4;
  --salon-brand: #25B4C1;
  --salon-brand-hover: #1f9ba8;
  --salon-bg: #f5f5f5;
  --salon-fg: #333333;
}

/* --- Body defaults --- */
body {
  background: var(--salon-bg);
  color: var(--salon-fg);
  font-family: 'Open Sans', sans-serif;
}

/* --- Buttons --- */
.btn-salon {
  background: var(--salon-brand);
  color: #fff;
  border-color: var(--salon-brand);
}
.btn-salon:hover,
.btn-salon:focus {
  background: var(--salon-brand-hover);
  border-color: var(--salon-brand-hover);
  color: #fff;
}
.btn-salon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-blue {
  background: #56aef0;
  color: #fff;
  border: 1px solid #56aef0;
  display: inline-block;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.42857;
  text-decoration: none;
}
.button-blue:hover { filter: brightness(0.95); color: #fff; text-decoration: none; }

.button { display: inline-block; padding: 6px 12px; cursor: pointer; font-size: 13px; text-decoration: none; }
.button-link { background: transparent; color: var(--salon-accent); border: none; padding: 6px 12px; cursor: pointer; }
.button-link:hover { text-decoration: underline; }

/* --- Sections (PanelSection wrapper) --- */
.salon-section {
  padding: 15px 20px;
  background: #fff;
  margin-bottom: 20px;
}
.salon-section > .actions {
  float: right;
  text-align: right;
  line-height: 36px;
}
.salon-section > h2 {
  font-size: 22px;
  font-weight: 400;
  margin: 20px 0 10px;
}

/* --- Column row --- */
.salon-column-row {
  padding: 15px 20px;
  background: #fff;
}
.salon-column-row h2 {
  font-size: 22px;
  font-weight: 400;
  margin: 20px 0 30px;
}

/* --- Boxes --- */
.box {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  margin-bottom: 15px;
  padding: 15px;
}
.info-box {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  padding: 15px;
  margin-bottom: 15px;
}
.info-box .box-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 10px;
}
.info-box .bottom-link {
  margin-top: 10px;
  text-align: right;
}
.info-box .bottom-link a { color: var(--salon-accent); font-size: 12px; }

/* --- Tree nav (sidebar customer groups) --- */
.tree { padding: 0; }
.tree a.root {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  color: #333;
  text-decoration: none;
  font-weight: 600;
}
.tree ul { list-style: none; padding-left: 15px; margin: 0; }
.tree li a {
  display: block;
  padding: 4px 10px;
  color: #555;
  text-decoration: none;
  font-size: 13px;
}
.tree li a:hover { background: #f5f8fa; }

/* --- Icon box --- */
.icon_box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

/* --- Table enhancements (on top of Bootstrap .table) --- */
.table-bordered th div {
  padding: 16px 24px 16px 8px;
}
.table-bordered th {
  font-size: 11px;
  font-weight: 600;
  background: #f5f8fa;
}
.table-bordered td {
  font-size: 13px;
  padding: 7px 10px 6px;
  border-top: 1px solid #ddd;
}
tr.odd td { background: #fff; }
tr.even td { background: #f4fbff; }

/* --- DL horizontal (detail views) --- */
.dl-horizontal dt { float: left; width: 160px; text-align: right; font-weight: 600; }
.dl-horizontal dd { margin-left: 170px; }

/* --- Actions toolbar --- */
.actions { text-align: right; line-height: 36px; }

/* --- Breadcrumb override --- */
.breadcrumb li,
.breadcrumb a {
  font-size: 20px;
  font-weight: 300;
  font-family: 'Lato', sans-serif;
}

/* --- Status colors (SalonBW-specific shades) --- */
.text-salon-green { color: #5cb85c; }
.text-salon-blue { color: #56aef0; }
.text-salon-red { color: #d9534f; }
.bg-salon-green { background: #5cb85c; color: #fff; }
.bg-salon-blue { background: #56aef0; color: #fff; }
.bg-salon-red { background: #d9534f; color: #fff; }

/* --- Date range input --- */
.salon-date-range {
  width: 210px;
  height: 28px;
  color: #919191;
  border: 1px solid #bfbfbf;
  padding: 4px 8px;
  font-size: 13px;
}

/* --- Overflow ellipsis utility --- */
.overflow_with_ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- SalonBW badge variants --- */
.badge-salon { background: var(--salon-brand); color: #fff; }
.badge-salon-success { background: #dff0d8; color: #3c763d; }
.badge-salon-warning { background: #fcf8e3; color: #8a6d3b; }
.badge-salon-error { background: #f2dede; color: #a94442; }
.badge-salon-inactive { background: #e5e5e5; color: #666; }

/* --- Form accent (focus ring) --- */
.form-control:focus {
  border-color: var(--salon-brand);
  box-shadow: 0 0 0 0.2rem rgba(37, 180, 193, 0.25);
}

/* --- Pjax link styling --- */
a.pjax_link { color: var(--salon-accent); }
a.pjax_link:hover { text-decoration: underline; }
```

Note: Icon sprite positions will be ported from `Icon.css` and `responsive.css` in a separate step within this task — only extracting selectors actually used in the codebase.

- [ ] **Step 2: Extract used sprite icon classes**

Run grep to find all `sprite-` class usages in the codebase:

```bash
cd /Users/gniewkob/Repos/salonbw && grep -roh 'sprite-[a-z_]*' apps/panel/src/ | sort -u
```

For each found sprite class, extract the matching CSS rule from `apps/panel/public/versum-vendor/css/Icon.css` and `apps/panel/src/styles/salonbw-shell.css` (the sprite sheet position rules). Append them to `salon-theme.css` under a `/* --- Sprite icons --- */` section.

The format is:
```css
.icon { display: inline-block; background-image: url('/images/sprites.png'); background-repeat: no-repeat; }
.icon.sprite-group { background-position: -Xpx -Ypx; width: Wpx; height: Hpx; }
/* ... one rule per used sprite ... */
```

- [ ] **Step 3: Commit**

```bash
git add apps/panel/src/styles/salon-theme.css
git commit -m "feat(panel): create salon-theme.css with SalonBW custom classes"
```

---

## Task 3: Rewrite `globals.css` — remove Tailwind, keep plain CSS

**Files:**
- Modify: `apps/panel/src/styles/globals.css`

The current file has 1400 lines — `@import 'tailwindcss'` at top, then 172x `@apply` directives in `@layer components`. Replace with plain CSS equivalents for classes still needed, or drop if Bootstrap 5 / salon-theme.css covers them.

- [ ] **Step 1: Audit which `.salonbw-*` classes from globals.css are actually used**

```bash
cd /Users/gniewkob/Repos/salonbw && grep -roh 'salonbw-[a-z_-]*' apps/panel/src/pages/ apps/panel/src/components/ --include='*.tsx' | sort | uniq -c | sort -rn
```

This tells us which `salonbw-*` classes from `globals.css` are referenced in TSX files. Only those need porting to plain CSS.

- [ ] **Step 2: Rewrite globals.css**

Replace the entire file with:

```css
/* Bootstrap 5 is imported in _app.tsx via JS import */

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300&display=swap');

/* Third-party overrides */
/* react-datepicker imported in _app.tsx via JS import */

/* FullCalendar overrides */
.fc {
  --fc-border-color: #e5e7eb;
  --fc-page-bg-color: #ffffff;
  --fc-neutral-bg-color: #ffffff;
}
.fc-view-harness { background: #fff !important; }
.fc-timegrid-body { background: #fff !important; }
.fc-timegrid-slots { background: #fff !important; }
.fc-timegrid-slot { background: #fff !important; border-bottom: 1px solid #f3f4f6 !important; }
.fc-timegrid-slot-lane { background: #fff !important; }
.fc-col-header-cell { background: #f3f4f6 !important; border-bottom: 2px solid #d1d5db !important; padding: 8px 4px !important; }
.fc-col-header-cell-cushion { color: #374151 !important; font-weight: 600 !important; font-size: 13px !important; }
.fc-event { border: none !important; border-radius: 3px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important; }
```

Then port each `salonbw-*` class that is actually used (from step 1) as plain CSS. For example, if `salonbw-mass-communication` is used, translate:

```css
/* Before (Tailwind @apply): */
.salonbw-mass-communication { @apply max-w-3xl mx-auto; }

/* After (plain CSS): */
.salonbw-mass-communication { max-width: 768px; margin-left: auto; margin-right: auto; }
```

Repeat for every used `salonbw-*` class. Drop unused classes entirely.

For `.btn`, `.btn-primary`, `.btn-secondary`, `.table`, `.badge` — **delete them** (Bootstrap 5 provides these natively).

- [ ] **Step 3: Verify no `@apply` or `@import 'tailwindcss'` remains**

```bash
grep -n '@apply\|@import.*tailwind\|@tailwind' apps/panel/src/styles/globals.css
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add apps/panel/src/styles/globals.css
git commit -m "refactor(panel): rewrite globals.css — remove Tailwind, plain CSS only"
```

---

## Task 4: Rename `components/salonbw/` → `components/salon/` and file renames

**Files:**
- Rename: entire `apps/panel/src/components/salonbw/` directory → `apps/panel/src/components/salon/`
- Rename files within: `SalonBWShell.tsx`→`SalonShell.tsx`, `SalonBWSecondaryNav.tsx`→`SalonSecondaryNav.tsx`, `SalonBWSvgSprites.tsx`→`SalonSvgSprites.tsx`, `SalonBWTopbar.tsx`→`SalonTopbar.tsx`, `SalonBWMainNav.tsx`→`SalonMainNav.tsx`, `SalonBWIcon.tsx`→`SalonIcon.tsx`, `VersumBreadcrumbs.tsx`→`SalonBreadcrumbs.tsx`, `SalonBWListNav.tsx`→`SalonListNav.tsx`
- Delete: `SalonBWVendorCss.tsx`
- Rename: `apps/panel/src/styles/salonbw-shell.css` → `apps/panel/src/styles/salon-shell.css`

- [ ] **Step 1: Rename directory**

```bash
cd /Users/gniewkob/Repos/salonbw
git mv apps/panel/src/components/salonbw apps/panel/src/components/salon
```

- [ ] **Step 2: Rename files within `components/salon/`**

```bash
cd /Users/gniewkob/Repos/salonbw
git mv apps/panel/src/components/salon/SalonBWShell.tsx apps/panel/src/components/salon/SalonShell.tsx
git mv apps/panel/src/components/salon/SalonBWSecondaryNav.tsx apps/panel/src/components/salon/SalonSecondaryNav.tsx
git mv apps/panel/src/components/salon/SalonBWSvgSprites.tsx apps/panel/src/components/salon/SalonSvgSprites.tsx
git mv apps/panel/src/components/salon/SalonBWTopbar.tsx apps/panel/src/components/salon/SalonTopbar.tsx
git mv apps/panel/src/components/salon/SalonBWMainNav.tsx apps/panel/src/components/salon/SalonMainNav.tsx
git mv apps/panel/src/components/salon/SalonBWIcon.tsx apps/panel/src/components/salon/SalonIcon.tsx
git mv apps/panel/src/components/salon/VersumBreadcrumbs.tsx apps/panel/src/components/salon/SalonBreadcrumbs.tsx
git mv apps/panel/src/components/salon/navs/SalonBWListNav.tsx apps/panel/src/components/salon/navs/SalonListNav.tsx
```

- [ ] **Step 3: Delete VendorCss component**

```bash
git rm apps/panel/src/components/salon/SalonBWVendorCss.tsx
```

- [ ] **Step 4: Rename CSS file**

```bash
git mv apps/panel/src/styles/salonbw-shell.css apps/panel/src/styles/salon-shell.css
```

- [ ] **Step 5: Update internal imports within renamed components**

In each renamed file, update imports that reference sibling files. Key changes:

- `SalonShell.tsx`: update imports from `./SalonBWMainNav` → `./SalonMainNav`, `./SalonBWSecondaryNav` → `./SalonSecondaryNav`, `./SalonBWTopbar` → `./SalonTopbar`, etc.
- `SalonSecondaryNav.tsx`: update any internal references
- `navigation.ts`: update exported type/function names if they contain "Versum" or "SalonBW" (e.g. `resolveSalonBWModule` → `resolveSalonModule`, `visibleSalonBWModules` → `visibleSalonModules`)

Use find-and-replace across all files in `apps/panel/src/components/salon/`:

```bash
cd /Users/gniewkob/Repos/salonbw
# Update all internal imports
grep -rl 'SalonBW' apps/panel/src/components/salon/ | head -20
# Then edit each file to replace SalonBW references
```

- [ ] **Step 6: Update `PanelSection.tsx` class name**

Change `edit_branch_form` → `salon-section`:

```tsx
// Before:
<div className={`edit_branch_form${className ? ` ${className}` : ''}`}>

// After:
<div className={`salon-section${className ? ` ${className}` : ''}`}>
```

- [ ] **Step 7: Commit renames**

```bash
git add -A
git commit -m "refactor(panel): rename salonbw→salon, remove VendorCss, rename Versum→Salon"
```

---

## Task 5: Update `_app.tsx` and all page imports

**Files:**
- Modify: `apps/panel/src/pages/_app.tsx`
- Modify: 66 page files (SalonBWShell→SalonShell, VersumBreadcrumbs→SalonBreadcrumbs imports)
- Modify: 8 page files (remove SalonBWVendorCss import/usage)
- Modify: all component files referencing old paths

- [ ] **Step 1: Update `_app.tsx` imports**

Change:
```tsx
import '@/styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/salonbw-shell.css';
import SalonBWSvgSprites from '@/components/salonbw/SalonBWSvgSprites';
```

To:
```tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/salon-theme.css';
import '@/styles/salon-shell.css';
import '@/styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import SalonSvgSprites from '@/components/salon/SalonSvgSprites';
```

And in JSX: `<SalonBWSvgSprites />` → `<SalonSvgSprites />`

- [ ] **Step 2: Bulk replace imports across all page files**

Run find-and-replace across `apps/panel/src/`:

```
from '@/components/salonbw/SalonBWShell'       → from '@/components/salon/SalonShell'
from '@/components/salonbw/VersumBreadcrumbs'   → from '@/components/salon/SalonBreadcrumbs'
from '@/components/salonbw/SalonBWVendorCss'    → DELETE entire import line
from '@/components/salonbw/SalonBWIcon'         → from '@/components/salon/SalonIcon'
from '@/components/salonbw/                     → from '@/components/salon/
```

Component usage in JSX:
```
<SalonBWShell         → <SalonShell
</SalonBWShell>       → </SalonShell>
<VersumBreadcrumbs    → <SalonBreadcrumbs
<SalonBWVendorCss />  → DELETE entire line
<SalonBWIcon          → <SalonIcon
```

Variable/type names:
```
SalonBWShellProps → SalonShellProps (in SalonShell.tsx)
```

- [ ] **Step 3: Remove SalonBWVendorCss usage from 8 pages**

Files that import SalonBWVendorCss (remove import + `<SalonBWVendorCss />` JSX):
- `apps/panel/src/pages/customers/index.tsx`
- `apps/panel/src/pages/customers/[id].tsx`
- `apps/panel/src/pages/customers/[id]/edit.tsx`
- `apps/panel/src/pages/customers/new.tsx`
- `apps/panel/src/pages/products/index.tsx` (via WarehouseLayout)
- `apps/panel/src/pages/products/[id]/edit.tsx`
- `apps/panel/src/pages/products/new.tsx`
- `apps/panel/src/components/warehouse/WarehouseLayout.tsx`

- [ ] **Step 4: Update other component imports**

Files in `apps/panel/src/components/` that import from `salonbw/`:
- `DashboardLayout.tsx`
- `warehouse/WarehouseLayout.tsx`
- `settings/SettingsDetailLayout.tsx`
- `settings/CalendarSettingsForm.tsx`
- `settings/*.tsx` (all settings components)
- `help/HelpContactPage.tsx`
- `calendar/CalendarView.tsx`
- `apps/panel/src/contexts/SecondaryNavContext.tsx`

Update all `@/components/salonbw/` → `@/components/salon/` and component names.

- [ ] **Step 5: Update test files**

```bash
grep -rl 'VersumBreadcrumbs\|salonbw' apps/panel/src/__tests__/ | head -10
```

Update test imports and references.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(panel): update all imports salonbw→salon, remove VendorCss usage"
```

---

## Task 6: Delete vendor CSS directory

**Files:**
- Delete: `apps/panel/public/versum-vendor/` (entire directory)

- [ ] **Step 1: Delete vendor CSS**

```bash
cd /Users/gniewkob/Repos/salonbw
git rm -rf apps/panel/public/versum-vendor/
```

- [ ] **Step 2: Check for any remaining references to versum-vendor**

```bash
grep -r 'versum-vendor\|salonbw-vendor' apps/panel/src/ --include='*.tsx' --include='*.ts' --include='*.css'
```

Update or remove any found references. Key places:
- `apps/panel/src/__tests__/middlewareAssets.test.ts` — update test assertions
- `apps/panel/src/__tests__/calendarEmbedRuntime.test.ts` — update test assertions

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(panel): delete versum-vendor CSS directory (~1.1MB)"
```

---

## Task 7: Migrate page Tailwind classes → Bootstrap 5 (Batch 1 — Shell + Customers)

**Files:**
- Modify: pages in `apps/panel/src/pages/customers/` (4 files)
- Modify: `apps/panel/src/components/warehouse/WarehouseLayout.tsx`

These pages already used vendor Bootstrap CSS so they have minimal Tailwind. Main work: remove any Tailwind utility classes.

- [ ] **Step 1: Audit Tailwind classes in customers pages**

```bash
grep -n 'className=.*\(flex\|grid\|gap-\|w-\|h-\|p-\|m-\|text-\|bg-\|rounded\|border\|shadow\)' apps/panel/src/pages/customers/*.tsx apps/panel/src/pages/customers/*/edit.tsx
```

- [ ] **Step 2: Replace Tailwind → Bootstrap in each file**

Translation reference:
- `flex` → `d-flex`
- `flex-col` → `flex-column`
- `items-center` → `align-items-center`
- `justify-between` → `justify-content-between`
- `gap-2` → `gap-2` (same)
- `w-full` → `w-100`
- `text-sm` → `small`
- `text-center` → `text-center` (same)
- `bg-gray-50` → `bg-light`
- `bg-white` → `bg-white` (same)
- `rounded` → `rounded` (same)
- `rounded-lg` → `rounded-3`
- `border` → `border` (same)
- `border-gray-200` → `border-light`
- `hidden` → `d-none`
- `p-4` → `p-4` (same)
- `mb-4` → `mb-4` (same)
- `text-gray-500` → `text-muted`
- `text-gray-700` → `text-body`
- `text-gray-800` → `text-dark`
- `font-medium` → `fw-medium`
- `font-semibold` → `fw-semibold`
- `font-bold` → `fw-bold`
- `text-lg` → `fs-5`
- `text-xl` → `fs-4`
- `text-2xl` → `fs-3`
- `text-3xl` → `fs-2`
- `shadow-sm` → `shadow-sm` (same)
- `overflow-x-auto` → `overflow-auto`
- `cursor-pointer` → `role="button"` or custom CSS
- `transition-colors` → remove (Bootstrap handles transitions)
- `hover:bg-gray-100` → remove (add in salon-theme.css if needed)
- `space-y-2` → remove (use `mb-2` on children)
- `grid grid-cols-2` → `row` + 2x `col-6`
- `grid grid-cols-3` → `row` + 3x `col-4`
- `max-w-3xl` → `mx-auto` + `style={{maxWidth: '768px'}}`
- `inset-0` → custom CSS or Bootstrap positioning
- `bg-black/50` → custom CSS `background: rgba(0,0,0,0.5)`

Edit each file applying these translations.

- [ ] **Step 3: Verify lint + typecheck**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src/pages/customers --fix && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/panel/src/pages/customers/ apps/panel/src/components/warehouse/
git commit -m "refactor(panel/customers): migrate Tailwind classes to Bootstrap 5"
```

---

## Task 8: Migrate Tailwind → Bootstrap 5 (Batch 2 — Warehouse/Products)

**Files:**
- Modify: `apps/panel/src/pages/products/` (3 files)
- Modify: `apps/panel/src/pages/sales/` (if exists)
- Modify: `apps/panel/src/pages/deliveries/` (if exists)
- Modify: `apps/panel/src/pages/inventory/` (if exists)
- Modify: `apps/panel/src/pages/orders/` (if exists)

- [ ] **Step 1: Audit + translate Tailwind classes**

Use same translation reference from Task 7. Edit each file.

- [ ] **Step 2: Verify lint + typecheck**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src/pages/products src/pages/sales src/pages/deliveries src/pages/inventory src/pages/orders --fix && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/panel/src/pages/products/ apps/panel/src/pages/sales/ apps/panel/src/pages/deliveries/ apps/panel/src/pages/inventory/ apps/panel/src/pages/orders/
git commit -m "refactor(panel/warehouse): migrate Tailwind classes to Bootstrap 5"
```

---

## Task 9: Migrate Tailwind → Bootstrap 5 (Batch 3 — Services)

**Files:**
- Modify: `apps/panel/src/pages/services/` (3 files: index.tsx, new.tsx, [id]/index.tsx)
- Modify: `apps/panel/src/components/services/` (modals, forms using Tailwind)

- [ ] **Step 1: Audit + translate Tailwind classes**

Services pages have moderate Tailwind usage (~28 occurrences in new.tsx, ~21 in [id]/index.tsx). Apply translation reference.

- [ ] **Step 2: Verify lint + typecheck**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src/pages/services src/components/services --fix && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/panel/src/pages/services/ apps/panel/src/components/services/
git commit -m "refactor(panel/services): migrate Tailwind classes to Bootstrap 5"
```

---

## Task 10: Migrate Tailwind → Bootstrap 5 (Batch 4 — Statistics)

**Files:**
- Modify: `apps/panel/src/pages/statistics/` (12 files — heaviest Tailwind usage)

Statistics pages are the heaviest users of Tailwind (worktime: 64, register: 41, value: 47 occurrences).

- [ ] **Step 1: Audit + translate Tailwind classes**

Apply translation reference. Pay special attention to grid layouts used in statistics dashboards.

- [ ] **Step 2: Verify lint + typecheck**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src/pages/statistics --fix && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/panel/src/pages/statistics/
git commit -m "refactor(panel/statistics): migrate Tailwind classes to Bootstrap 5"
```

---

## Task 11: Migrate Tailwind → Bootstrap 5 (Batch 5 — Communication)

**Files:**
- Modify: `apps/panel/src/pages/communication/` (5 files: index, [id], mass, templates, reminders)

- [ ] **Step 1: Audit + translate**

Mass communication page has the most custom `salonbw-*` classes — these were already ported to plain CSS in `globals.css` (Task 3). Just replace Tailwind utility classes.

- [ ] **Step 2: Verify lint + typecheck**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src/pages/communication --fix && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/panel/src/pages/communication/
git commit -m "refactor(panel/communication): migrate Tailwind classes to Bootstrap 5"
```

---

## Task 12: Migrate Tailwind → Bootstrap 5 (Batch 6 — Settings + Extension + Remaining)

**Files:**
- Modify: `apps/panel/src/pages/settings/` (all files)
- Modify: `apps/panel/src/pages/extension/` (2 files)
- Modify: `apps/panel/src/pages/dashboard/`
- Modify: `apps/panel/src/pages/auth/` (login, register)
- Modify: `apps/panel/src/pages/admin/` (branches, gift-cards, loyalty, settings, timetables)
- Modify: `apps/panel/src/pages/employees/`
- Modify: `apps/panel/src/pages/newsletters/`
- Modify: `apps/panel/src/pages/notifications/`
- Modify: `apps/panel/src/pages/reviews/`
- Modify: `apps/panel/src/pages/invoices/`
- Modify: `apps/panel/src/pages/messages/`
- Modify: `apps/panel/src/pages/emails/`
- Modify: `apps/panel/src/pages/helps/`
- Modify: `apps/panel/src/pages/event-reminders/`

- [ ] **Step 1: Audit + translate all remaining pages**

Settings pages already use PanelSection/PanelTable so minimal Tailwind. Extension, dashboard, auth, admin pages need full audit.

- [ ] **Step 2: Migrate shared components**

Check and migrate Tailwind classes in:
- `apps/panel/src/components/settings/`
- `apps/panel/src/components/ui/`
- `apps/panel/src/components/salon/` (any remaining Tailwind)
- `apps/panel/src/components/DashboardLayout.tsx`
- `apps/panel/src/components/RouteProgress.tsx`
- Any other component files with Tailwind classes

- [ ] **Step 3: Verify lint + typecheck**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src --fix && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(panel): migrate remaining pages to Bootstrap 5"
```

---

## Task 13: Clean `salon-shell.css` — remove duplicates covered by Bootstrap 5

**Files:**
- Modify: `apps/panel/src/styles/salon-shell.css` (6103 lines)

- [ ] **Step 1: Audit for Bootstrap 5 duplicate classes**

Search `salon-shell.css` for classes that Bootstrap 5 now provides:
- `.form-control`, `.form-group` → Bootstrap native
- `.table`, `.table-bordered` → Bootstrap native
- `.btn`, `.btn-primary` → Bootstrap native
- `.modal`, `.modal-dialog` → Bootstrap native
- `.list-group`, `.list-group-item` → Bootstrap native
- `.row`, `.col-*` → Bootstrap native
- `.breadcrumb` → Bootstrap native
- `.badge` → Bootstrap native
- `.alert` → Bootstrap native

Remove any definitions that duplicate Bootstrap 5.

- [ ] **Step 2: Remove classes already in `salon-theme.css`**

Any `.salon-section`, `.button-blue`, `.box`, `.info-box` etc. that were duplicated in shell CSS.

- [ ] **Step 3: Rename `salonbw-` prefixed CSS variables to `salon-`**

```
--salonbw-topbar-h    → --salon-topbar-h
--salonbw-mainnav-w   → --salon-mainnav-w
--salonbw-sidenav-w   → --salon-sidenav-w
--salonbw-accent      → --salon-accent
--salonbw-mainnav-bg  → --salon-mainnav-bg
--salonbw-panel-bg    → --salon-panel-bg
```

Update all references in `salon-shell.css` AND in any TSX/CSS files that use these variables.

- [ ] **Step 4: Verify build + lint**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src --fix && pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(panel/css): clean salon-shell.css, remove Bootstrap 5 duplicates"
```

---

## Task 14: Final verification — zero Tailwind, build succeeds

**Files:** None (verification only)

- [ ] **Step 1: Verify zero Tailwind references**

```bash
cd /Users/gniewkob/Repos/salonbw
grep -r 'tailwindcss\|@tailwind\|@apply' apps/panel/src/ --include='*.css' --include='*.tsx' --include='*.ts' --include='*.mjs'
grep -r 'tailwind' apps/panel/package.json
```

Expected: no output

- [ ] **Step 2: Verify zero vendor CSS references**

```bash
grep -r 'versum-vendor\|salonbw-vendor\|SalonBWVendorCss' apps/panel/src/
ls apps/panel/public/versum-vendor/ 2>/dev/null
```

Expected: no output / directory not found

- [ ] **Step 3: Verify all "Versum" renamed in components**

```bash
grep -r 'Versum' apps/panel/src/components/ --include='*.tsx' --include='*.ts' -l
```

Expected: no files (except possibly comments referencing source system — acceptable)

- [ ] **Step 4: Full lint + typecheck**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm eslint src --fix && pnpm tsc --noEmit
```

- [ ] **Step 5: Full build**

```bash
cd /Users/gniewkob/Repos/salonbw/apps/panel && pnpm build
```

Expected: build succeeds

- [ ] **Step 6: Update docs**

Update `CLAUDE.md` active-context section:
- Current phase: Bootstrap 5 migration COMPLETE
- Remove references to Tailwind, vendor CSS
- Update key files section (new paths)

Update `docs/VERSUM_CLONE_PROGRESS.md`:
- Note: styling foundation changed from Tailwind to Bootstrap 5

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "docs: update project docs for Bootstrap 5 migration"
```
