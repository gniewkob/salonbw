# Brand skill widoczny dla Codexa + sprzątanie repo

- **Data:** 2026-10-24
- **Agent:** Claude Opus 5.5
- **Commit(y):** `29cce858`, ten commit
- **PR:** brak

## Finding

W repo leżała nieśledzona kopia `.agents/skills/salonbw-brand/SKILL.md`,
identyczna z `.claude/skills/salonbw-brand/SKILL.md`. Kopię usunięto jako
duplikat, ale `.agents/skills` to najpewniej ścieżka skilli repo dla Codexa,
więc Codex straciłby brand skill. Druga kopia mogłaby też rozjechać się
z oryginałem.

## Change

Względny symlink `.agents/skills/salonbw-brand` →
`../../.claude/skills/salonbw-brand`. Jedno źródło prawdy dla obu agentów.
Usunięta też lokalna, już scalona gałąź
`claude/customer-filters-email-search-last-done`.

## Validation

- `head .agents/skills/salonbw-brand/SKILL.md` czyta frontmatter
  `name: salonbw-brand` przez symlink.
- Git zapisuje wpis jako link (1 plik, 1 linia), bez kopii treści.
- Niezweryfikowane: że Codex faktycznie ładuje skille z `.agents/skills`.

## Rollout

Nie dotyczy (bez zmian kodu aplikacji).

## Follow-up

- Owner usuwa stary worktree `.worktrees/synthetic-schedule-alignment`
  (praca w nim jest już na masterze jako #1477; reszta to zmiany prettiera).
  Sandbox agenta nie pozwolił na zapis w `.git/worktrees`.
- Przy następnej zmianie UI w Codexie sprawdzić, czy wczytuje `salonbw-brand`.
