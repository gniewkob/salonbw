# Ręczny kanał DEV rozszerzony o landing

- **Data:** 2026-11-18
- **Agent:** Claude Opus 5.5
- **Commit(y):** gałąź `ops/dev-landing-manual-20261118`
- **PR:** brak

## Finding
GitHub Actions nie startuje (blokada płatności, CI 44165964482). Ręczny kanał
MyDevil (`docs/GITHUB_ACTIONS_OUTAGE_FALLBACK.md`) obsługiwał tylko API i
panel, więc nowej strony głównej (`design/black-white-homepage-20261117`)
nie dało się wdrożyć na `dev.salon-bw.pl`. Odczyt hosta (SSH, bez zmian):
żywy landing to `~/apps/nodejs/salonbw` (link `domains/dev.salon-bw.pl/
public_nodejs`), `APP_RELEASE=58610f7c…`, **brak `public/__release.json`**.

## Change
Wariant landingu na wzór panelu: `scripts/ci/package-manual-dev-landing.sh`,
`scripts/mydevil/manual-dev-landing-stage.sh`,
`scripts/mydevil/manual-dev-landing-activate.mjs` + testy
`scripts/ci/manual-dev-landing-activate.test.mjs`,
`scripts/ci/manual-dev-landing-packaging.test.sh`, sekcja w runbooku.
Różnice: akceptacja starej wersji bez `__release.json` (tylko jako
poprzedniej), smoke na `/`, brak wymogu archiwum właściciela.

## Validation
`node --test manual-dev-landing-activate.test.mjs` **20/20** (15 przeniesionych
z panelu + 5 dla wersji legacy); `manual-dev-landing-packaging.test.sh` PASS
(Linux, Node 22).

## Rollout
Owner zatwierdził przełączenie SHA `09611f5ec19aa6f2711254f59666a5913318a9d6`
(strona główna Black & White + przeniesiona redakcja PR #1703, bez której
skan gitleaks bieżącego drzewa blokował pakowanie).

1. Próba 1 (00:13): `/` → 500, automatyczne wycofanie do `58610f7c` OK.
   Smoke na gnieździe Unix: `Cannot find module '@next/env'` — zależności
   standalone śledzone przez pnpm na Macu. Naprawa: bez śledzonych
   `node_modules` + szkielet `next/package.json` (inaczej `app.cjs`
   kasuje główne `next/dist` przez dowiązanie).
2. Próba 2: `/` → 500, wycofanie OK. Przyczyna: smoke zostawił w stage
   bezwzględne dowiązania tworzone przez `app.cjs` przy starcie; po
   przeniesieniu katalogu wskazywały w próżnię. Naprawa: smoke usuwa swoje
   dowiązania, plan aktywacji odmawia przy pozostałościach.
3. Próba 3: `DEV_LANDING_ACTIVATION=PASS`, `PASSENGER_HTTP_SMOKE=PASS`.

Live-verify (Basic Auth): `/__release.json` sha `09611f5e`, BUILD_ID
`6oXzYHijrUAlwWl3H0-K_`; `/`, `/services`, `/contact`, `/gallery`,
`/policy`, `/privacy`, `/data-deletion` = 200; `/design-lab` = 404;
anonimowo `/` = 401; CSS `immutable`. Poprzednia wersja zachowana w
`~/.salonbw-manual/previous-landing/58610f7c…-before-09611f5e…`.
Produkcja nietknięta.

## Follow-up
- Odbiór wizualny strony głównej na dev przez ownera.
- Osobno: `app.cjs` — `syncNextDist` nie powinien usuwać celu przez
  dowiązanie; dowiązania względne zamiast bezwzględnych.
- Gdy billing GitHub wróci: CI na `design/black-white-homepage-20261117`
  i PR do `master`.
