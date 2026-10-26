# Booksy i SalonBW — ręczne utrzymywanie obu systemów

- **Data:** 2026-10-26
- **Agent:** Codex
- **PR:** #1521
- **Decyzje ownera:** „Booksy będzie jeszcze utrzymywany przez jakiś czas”;
  „Na razie będziemy ręcznie utrzymywać dwa systemy”.

## Finding

Plan zakończenia traktował Booksy jako backup i wiązał eksport z odcięciem
zapisów. To nie opisuje aktualnej decyzji. Importer pomija linked bookings
(import-booksy.ts, visit selection), więc idempotencja nie jest synchronizacją.
Ręczne kopie mogą nie mieć linku i muszą zostać rozliczone przed importem.

## Change

UAT_PLAN opisuje kontrolę obu kalendarzy, nowych wizyt, zmian i anulowań,
prywatny rejestr kopii oraz rozliczanie duplikatów. Świeży eksport i GO są
bramkami operacji produkcyjnej, nie zakończenia UAT na dev. Brak daty lub
zgody na zakończenie Booksy. PROJECT_COMPLETION_PLAN i PROJECT_STATE mają
aktualną decyzję; nie włączono automatycznej synchronizacji/importu.

## Validation

- Przejrzano visit selection importera: linked appointments pomijane.
- Reconciliation raportuje linkedDrift, linkedActiveAbsentFromSource,
  nativeExactCandidates i konflikty; readyForImport zawsze false.
- Wynik aktywnego wątku UAT odczytany przez snapshot: zapis i potwierdzenie
  na dev działają; defekty wejścia z landingu nadal badane. Bez końcowego PASS.
- Zmiana dotyczy dokumentacji; brak zmian aplikacji, konfiguracji lub danych.
  Sprawdzenia whitespace i handoff przed pushem.

## Rollout

Wyłącznie dokumentacja w PR #1521. Bez merge, deploymentu, importu, kolejnego
cleanupu lub wyłączenia Booksy. Checkouty ownera i równoległego UAT nietknięte.

## Follow-up

Sesja UAT domyka defekty i testy dev. Przed kolejnym produkcyjnym importem:
świeży eksport, reconciliation obu kalendarzy i ręcznych kopii, decyzje o
wyjątkach oraz zatwierdzony plan/backup/GO. Booksy pozostaje aktywne.
