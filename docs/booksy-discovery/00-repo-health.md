# 00 — Repo Health

Data audytu: 2026-04-30

## Komendy i wynik

| Komenda | Wynik | Blokuje discovery? | Uwagi / rekomendacja |
| --- | --- | --- | --- |
| `git fetch origin` | OK | Nie | Repo zsynchronizowane z remote metadata. |
| `git status --short --branch` | OK (`master`, lokalne modyfikacje) | Nie | Worktree jest dirty; nie wolno robić bezrefleksyjnego `pull --rebase`. |
| `git pull origin master` | FAIL | Nie (dla discovery) | Błąd: `cannot pull with rebase: You have unstaged changes`. Rekomendacja: osobny branch + commit/stash ownera przed synchronizacją. |
| `pnpm install` | OK | Nie | Lockfile aktualny; brak nowych zależności. Ostrzeżenie o `ignored build scripts` nie blokuje discovery. |
| `pnpm lint` | OK (warnings only) | Nie | Backend: 190 ostrzeżeń TS-eslint; panel: 6 ostrzeżeń. Brak błędów. |
| `pnpm typecheck` | OK | Nie | Backend + panel + landing przechodzą bez błędów. |

## Dokładny błąd blokujący `git pull`

```text
error: cannot pull with rebase: You have unstaged changes.
error: Please commit or stash them.
```

## Ocena wpływu

- Discovery i przygotowanie dokumentacji nie są blokowane.
- Potencjalnie blokowane są działania wymagające najnowszego `origin/master` (np. implementacja po discovery).

## Rekomendowana poprawka operacyjna

1. Właściciel repo decyduje, które lokalne zmiany zachować.
2. Wykonać: commit/stash lokalnych zmian.
3. Ponowić: `git pull origin master`.
4. Dopiero potem rozpocząć implementację sprintów z backlogu.
