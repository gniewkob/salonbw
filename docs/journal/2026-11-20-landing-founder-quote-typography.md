# 2026-11-20 — landing: cudzysłów niemiecki cytatu założycielki

- **Data:** 2026-11-20
- **Agent:** Codex
- **Gałąź:** `fix/landing-founder-quote-typography-20261120`
- **Baza:** `design/brand-unification-20261118` (`703849bfe5839b7d5e75aaf97124d82dc9bc46ba`, PR #1735 scalony)
- **PR:** do przeglądu

## Finding

`HomeFounder` wyświetlał niemieckie tłumaczenie z polsko-angielskim znakiem
zamknięcia `”`, czyli `„… ”`, zamiast niemieckiego `„…“`. Testy dotychczas
sprawdzały jedynie obecność tłumaczenia i nie wykrywały błędnej interpunkcji
ani nadmiarowego tekstu w nagłówku.

## Change

- W `apps/landing/src/components/home/BlackWhiteHome.tsx` domknięcie cytatu dla
  `de` to `“`; zapis `pl` i `en` pozostaje bez zmian.
- `founderQuoteLanguage.test.tsx` porównuje **pełne `textContent`** nagłówka w
  PL/EN/DE i po przełączeniu języka. Polski cytat nadal pochodzi z CMS, a nie
  z tłumaczenia słownikowego.
- Nie zmieniono treści CMS, słowników tłumaczeń ani warstwy danych.

## Validation

- **RED** przed poprawką: 2/4 testów nie przechodziły dokładnie przez niemiecki
  znak zamknięcia (`Expected: …“`, `Received: …”`).
- **GREEN**: testy cytatu 4/4 PASS; cały Jest landingu 114/114 PASS (28 suite).
- `corepack pnpm --filter @salonbw/landing typecheck` — PASS.
- ESLint na obu zmienionych plikach — PASS.
- `corepack pnpm --filter @salonbw/landing build` — PASS, 12/12 stron.
- Lokalny executor: Node v24.22.3 i pnpm v10.14.0; testy Node 22 na dokładnym
  SHA oraz CI nie zostały tu uruchomione.
- Instalacja zależności wymagała `CYPRESS_INSTALL_BINARY=0`, bo pobieranie
  binarki Cypress zakończyło się HTTP 403. Cypress E2E nie uruchamiano.

## Rollout

Na etapie commitu: **DEV_DEPLOY=NOT_STARTED**, **PRODUCTION_MUTATIONS=NONE**.
Poprzedni potwierdzony DEV landing `dfb9661271984872bc17f83f92477facf59ffd0f`.
Nowa wersja wymaga osobnego exact-SHA staging, testów HTTP/Unix socket,
planowania i aktywacji, odczytu aktywnego `__release.json` oraz UAT przeglądarki.

## Follow-up

PR do gałęzi design; po przeglądzie i weryfikacji Node 22 wykonać bezpieczne
wdrożenie wyłącznie do DEV i zweryfikować niemiecki nagłówek na żywo.
