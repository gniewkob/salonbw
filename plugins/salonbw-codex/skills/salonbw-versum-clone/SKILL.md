---
name: salonbw-versum-clone
description: Use for copy-first Versum parity work in panel/admin, including route mapping, compatibility aliases, smoke verification, and clone progress bookkeeping.
---

# SalonBW Versum Clone

Use this skill when the task is to clone, port, or finish a Versum screen, flow, or route in SalonBW.

## Source of truth

Read these before editing:

- `docs/VERSUM_CLONING_STANDARD.md`
- `docs/VERSUM_CLONE_PROGRESS.md`
- `AGENTS.md`
- `Agent.md`

## Workflow

1. Identify the exact source screen, route, and user flow being cloned.
2. Confirm the canonical SalonBW target surface:
   - `apps/panel`
   - `apps/admin`
   - panel compat aliases such as `/clients` or `/admin/*` only when explicitly needed
3. Follow the copy-first rule:
   - preserve layout, interaction order, naming, and affordances first
   - adapt implementation details only after parity is established
4. Keep route semantics consistent with repo instructions:
   - canonical panel routes include `/calendar`, `/customers`, `/products`, `/statistics`, `/communication`, `/services`, `/settings`, `/extension`
5. If any behavior is intentionally different, record that deviation in `docs/VERSUM_CLONE_PROGRESS.md`.
6. Do not mark a view complete if actions are stubbed, hidden behind TODOs, or missing post-change smoke verification.

## Validation

- Run route-level smoke on the changed view.
- Verify visual parity with screenshots or source references if available.
- Verify compatibility aliases and redirects only when the cloned flow depends on them.
- If the view affects calendar runtime, validate the vendored Versum calendar entrypoint and rewrites.

## Recommended external attachments

Use these global or downloaded references selectively when the clone needs more implementation depth:

- Global `playwright-pro`
  - `reference/golden-rules.md`
  - `reference/locators.md`
  - `reference/assertions.md`
  - `reference/common-pitfalls.md`
  - `skills/generate/SKILL.md`
  - `skills/review/SKILL.md`
  - `skills/fix/SKILL.md`
  - `templates/auth/login.md`
  - `templates/dashboard/data-loading.md`
  - `templates/settings/profile-update.md`
  - `templates/settings/password-change.md`

- Downloaded `senior-frontend`
  - `references/react_patterns.md`
  - `references/frontend_best_practices.md`

Use them in this order:

1. Clone and route-match with SalonBW rules first.
2. Use `playwright-pro` references to verify auth/dashboard/settings behavior and improve smoke coverage.
3. Use `senior-frontend` references only to clean implementation details after parity is already achieved.

## Guardrails

- Do not redesign while cloning.
- Do not remove compatibility routes without explicit confirmation.
- Do not mark progress as `100%` unless the UI and the main action path both work.
