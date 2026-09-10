# Jednokrotna finalizacja i spójny stan końcowy wizyty

- **Data:** 2026-09-11
- **Agent:** Codex
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

`finalizeAppointment` sprawdzało status przed transakcją i aktualizowało wiersz
bez warunku. Test fail-first na izolowanym PostgreSQL z dwoma równoległymi
żądaniami zakończył oba sukcesem. Powstały po dwie receptury, sprzedaże i
zużycia, a zapas produktu i materiału został pomniejszony dwukrotnie.
Unikalność prowizji usługowej nie chroniła pozostałych zapisów.

## Change

- Każda finalizacja ponownie odczytuje wizytę pod blokadą
  `pessimistic_write` wewnątrz tej samej transakcji co rozliczenie.
- Po uzyskaniu blokady status jest ponownie walidowany przed pierwszym zapisem.
- Tę samą serializację zastosowano do prostego zakończenia i anulowania, więc
  wszystkie wejścia do stanu końcowego korzystają z jednej reguły.
- Drugie równoległe żądanie otrzymuje istniejący błąd domenowy 400; nie zapisuje
  żadnych skutków ubocznych.

## Validation

- PostgreSQL fail-first przed poprawką: 2 sukcesy zamiast 1; widoczne dwa
  komplety sprzedaży, zużycia i receptury.
- PostgreSQL po poprawce: 9/9 PASS, w tym podwójna finalizacja oraz wyścig
  anulowanie–finalizacja.
- Testy serwisu wizyt: 44/44 PASS.
- Pełny backend: 51 zestawów / 407 testów PASS; typecheck i build PASS.
- Celowany ESLint: 0 błędów; `git diff --check`: PASS.
- Testy korzystały wyłącznie z syntetycznej bazy PostgreSQL uruchomionej w
  odrębnym kontenerze; bez danych produkcyjnych.

## Rollout

Commit `ef81d225`; CI `34538216816` i Deploy `34538216861` zakończone
`success`. Produkcyjny health potwierdził database, SMTP i Instagram `ok`, a
uruchomiony artefakt API zawiera blokadę `pessimistic_write`. Nie wykonywano
finalizacji ani anulowania na produkcji i nie użyto danych klientek.

## Follow-up

F6: uzależnić produkcyjny Deploy od zakończonego sukcesem CI dla dokładnie tego
samego SHA.
