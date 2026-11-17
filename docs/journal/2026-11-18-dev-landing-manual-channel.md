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
Patrz następny wpis / wynik wykonania na hoście.

## Follow-up
Wykonać na Macu: source sync → pakowanie → stage → `--plan`; `--execute`
tylko po zgodzie ownera na konkretny SHA.
