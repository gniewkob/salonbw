# V18: filtr zespołu po review PR #1705

- **Data:** 2026-11-13
- **Agent:** Codex
- **PR:** #1705 (draft)

## Finding
Niezależne pobranie wykonawców mogło ukryć aktywny filtr po błędzie; panel boczny był niedostępny na ekranach do 760 px. Licznik wykonawców był opisany jako wszystkie osoby w systemie.

## Change
Komunikat i ponowienie pobrania, dostępny reset aktywnego filtra i ta sama karta filtra na telefonach. Podpis licznika określa wykonawców usług. Bez zmian API i środowisk.

## Validation
Test regresji błędu nie przechodził przed poprawką. Panel: 132 suites, 668 testów PASS; TypeScript PASS; lint zero błędów, istniejące ostrzeżenie hooka. Build Next PASS; syntetyczny Playwright Chromium 390 px wybór i reset PASS. Graf Graphify z 10 listopada jest nieaktualny; zależności sprawdzono w kodzie.

## Rollout
Nie wdrażano. Przed zmianą HEAD CI #43519414947 nie uruchomiło kroków; nowy exact-SHA CI pozostaje wymagany. DEV anonimowo: panel i chroniony kalendarz 401, health 200 — to nie dowodzi działania sesji lub izolacji bazy.

## Follow-up
Właściciel: rozwiązać blokadę CI i prywatnie zweryfikować oraz unieważnić/zmienić historycznie ujawnione dane. Przed DEV: exact-SHA CI, potwierdzenie izolacji i odtwarzania, a następnie kontrolowane UAT. DEV/PROD NO-GO.
