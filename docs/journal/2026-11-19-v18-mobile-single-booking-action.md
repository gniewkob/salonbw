# Studio V18 — single primary action in mobile booking drawer

- **Date:** 2026-11-19
- **Agent:** Codex / ChatGPT
- **PR:** #1731 (`fix/v18-single-save-action-20261119`)
- **Source base:** `6693f282a30d124076ed9da94bab167535d5a467`

## Finding

Owner's iPhone screenshot of **Nowa wizyta** on the protected DEV panel showed
two controls for the same save operation: `Utwórz wizytę` inside the inline
`Akcje` card and `Utwórz` in the mobile footer. The shared
`ActionsSection.tsx` rendered both paths on mobile; each calls `handleCreate`.
Edit mode similarly duplicated `handleUpdate`.

## Change

- Mobile create: footer has the only primary action; the now-empty `Akcje`
  card is omitted.
- Mobile edit: footer has the only Save action; the inline card remains only
  when there are meaningful status/secondary actions.
- Desktop create/edit: existing inline actions remain intact.
- The mobile footer now retains `createLabel` for explicit overlap overrides
  (for example, `Dodaj mimo to`), along with existing disabled/loading logic.
- Added six component regression cases for mobile/desktop create and edit,
  callback count, overlap label, and an empty edit actions card.

## Validation

- GitHub source readback after code commits: **PASS**.
- Fail-first: reintroduced the duplicate inline action in an isolated clone;
  **4 Jest cases failed and 2 passed**. Restored the fix, then targeted +
  existing `appointmentDrawer.test.tsx`: **54/54 PASS**.
- `pnpm --filter @salonbw/panel typecheck`: **PASS**.
- ESLint on both changed TSX files: **PASS**.
- Prettier on both TSX files: **PASS**.
- Next.js 15.5.28 production build and 123 data files: **PASS**.
- QA environment: Linux Node 24, pnpm 10.14.0; install completed with
  `--ignore-scripts` after an unrelated Cypress binary unzip failure.
- CI for exact PR HEAD and hosted browser UAT: **NOT VERIFIED**.

## Rollout

- The previous calendar release `6693f282a30d124076ed9da94bab167535d5a467`
  was deployed successfully earlier on DEV.
- This follow-up change has **not** been deployed or merged yet.
- No production or database changes are involved.

## Follow-up

Freeze updated HEAD, repeat the Mac exact-SHA QA under Node 22, then stage,
activate and verify the new DEV release via the guarded MyDevil fallback.
Complete mobile 390px interactive product UAT before closing.
