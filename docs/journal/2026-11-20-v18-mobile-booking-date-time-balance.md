# V18 — czytelne pola daty i godziny na iPhonie

- **Data:** 2026-11-20
- **Agent:** Codex
- **PR:** #1734 (Draft, aktualizowana gałąź `fix/v18-required-datetime-ux-20261120`)
- **Baza:** `8f206217dc3b48b282817edae6480689c1e668f2`

## Finding

UAT ownera na iPhonie po DEV `8f206217` pokazał nierówne pola: data zajmuje
większość wiersza, a „Wybierz godzinę” łamie się na dwa wiersze. Źródłem
jest `@media (max-width: 430px)` z kolumną godziny `108px` w
`apps/panel/src/styles/V18DateInput.module.css`. Dodatkowo `.requiredEmpty`
nakłada `inset box-shadow` na obramowanie, tworząc ciężki, podwójny kontur.
Nie stwierdzono potrzeby zmiany stanu wizyty ani API.

## Change

- Na telefonach 351–430 px oba pola zajmują po połowie wiersza. Zmniejszono
  odstępy od ikon zamiast zmniejszać grubość tekstu. Etykieta godziny pozostaje
  w jednej linii; przy szerokości do 350 px pola układają się pionowo.
- Wymagane puste pola nadal mają zaakcentowaną krawędź i tło, ale tylko
  pojedyncze obramowanie bez dodatkowego wewnętrznego cienia.
- Test regresyjny CSS i syntetyczny test Playwright 390/375/320 px; bez zmian
  logiki tworzenia wizyty, uprawnień, backendu ani danych.

## Validation

- Fail-first: kontrakt CSS — **RED** (`108px` zamiast równych kolumn),
  następnie **GREEN** (41/41 testów celowanych).
- Pełny Jest panel: **774/774 PASS**, 138 zestawów.
- TypeScript `tsc --noEmit`: **PASS**; ESLint zmienionego testu CSS: **PASS**.
- Playwright Chromium: **BLOCKED lokalnie** — brak zarządzanego binarium;
  próba z systemowym `/usr/bin/chromium` skończyła się `socket() EPERM`.
  Nie deklarujemy weryfikacji układu na realnej przeglądarce; test syntetyczny
  zostaje w repo do uruchomienia na Macu operatora.
- Next.js 15.5.28 build **PASS** (115 stron statycznych,
  `generate-next-data` — 123 pliki).

## Rollout

- **LOCAL:** PASS dla Jest/TypeScript/ESLint/build; browser UAT i Lighthouse UNKNOWN.
- **DEV:** nie uruchomiono nowego staging/aktywacji w tej sesji.
- **PROD/DB:** bez zmian.

## Follow-up

Opublikować exact SHA w PR #1734, wykonać Mac Node 22 QA z syntetycznym
Playwright 390/375/320, a następnie preflight → stage → Unix smoke → plan →
kontrolowany DEV rollout i wizualny iPhone UAT. Nie scalać PR przed odbiorem.
