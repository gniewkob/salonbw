# #1663 — izolowany prototyp bezpiecznego wydania frontendu

- **Data:** 2026-11-08
- **Agent:** Claude Opus 5.5
- **Commit(y):** gałąź `infra/1663-safe-release-prototype`
- **PR:** Draft (link w issue #1663)

## Finding
`scripts/mydevil/extract-frontend-bundle.sh` przenosi i usuwa `node_modules`
przy każdym deployu; bundle nie ma lockfile; `deploy.yml` wykonuje
`npm install --omit=dev --no-package-lock` w katalogu działającej aplikacji.
Przez ~30–40 s workery Passengera widzą nowe pliki przy brakujących/niepełnych
zależnościach, a wersje tranzytywne nie są przypięte. Korelacja z odczytem
RAM 112,04% (koniec npm install, run 42414588540) — bez atrybucji per-proces.

## Change
Prototyp `scripts/ci/safe-release.mjs` (niepodłączony do deploy.yml):
niezmienne `releases/<sha>`, przygotowanie wyłącznie w `.staging-*`,
walidacja lockfile końcowego manifestu (rejestr + sha512), content-addressed
`deps/<fingerprint>` (platforma/ABI/npm/lockfile), `npm ci` tylko w
nieaktywnym stagingu, aktywacja przez `rename(2)` wskaźnika, healthcheck SHA,
auto-recovery i rollback A→B→A. Testy unit/integration/E2E z mock Passengerem,
krok CI w `ops-workflow-regression`. Projekt: `docs/SAFE_RELEASE_DESIGN.md`.

## Validation
- `node --test scripts/ci/safe-release.test.mjs scripts/ci/safe-release.e2e.test.mjs` → 29/29 PASS, 0 skip (3 kolejne przebiegi). E2E wymaga bindu 127.0.0.1 (lokalny sandbox agenta go blokuje; uruchomione poza sandboxem).
- `bash scripts/check-ops-workflows.sh`, `check-ops-workflow-docs-consistency.sh`, `test-mydevil-release-rollback.sh` → PASS.
- Realny npm (macOS arm64, 1 próbka, zimny cache): lockfile faktycznego manifestu DEV panelu 334 wpisy → `check-lock` OK; legacy install 23,3 s / 481 MiB RSS vs `npm ci` 13,1 s / 374 MiB; 0 różnic wersji top-level (262).

## Rollout
Nie dotyczy — brak deployu, SSH, restartów i zmian na hostingu.

## Follow-up
Jedna kontrolowana walidacja DEV za zgodą PO: na `panelbw_dev` sprawdzić, czy
Passenger po `devil www restart` serwuje release wskazany symlinkiem
(`public_nodejs -> <root>/current`) i czy `npm22 ci` w nieaktywnym katalogu
działa na FreeBSD — z pomiarem RAM i gotowym powrotem do obecnego układu.
