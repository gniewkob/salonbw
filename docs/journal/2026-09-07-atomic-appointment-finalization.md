# Atomowe zakończenie wizyty i rozliczenie magazynu

- **Data:** 2026-09-07
- **Agent:** Codex
- **Commit(y):** oczekuje na commit; punkt wyjścia `e2741637`
- **PR:** brak; master

## Finding

`AppointmentsService.finalizeAppointment()` zatwierdzał status `completed`,
prowizję i formułę w jednej transakcji, a sprzedaż produktów i zużycie materiałów
zapisywał dopiero po jej zakończeniu przez osobne transakcje `RetailService`.

Dwa testy fail-first potwierdziły skutki:

- błąd sprzedaży odrzucał żądanie, ale wizyta pozostawała `completed`;
- błąd zużycia materiału był przechwytywany, żądanie kończyło się sukcesem,
  a wizyta pozostawała `completed` bez poprawnego rozchodu.

Nie odczytywano ani nie modyfikowano danych produkcyjnych.

## Change

- `RetailService.createSale()` i `createUsage()` przyjmują opcjonalny
  `EntityManager`. Wywołania samodzielne nadal otwierają własną transakcję,
  a wywołania z finalizacji korzystają z już otwartej transakcji wizyty.
- Aktualizacja wizyty, prowizja, formuła, sprzedaż i oba warianty danych o
  zużyciu materiałów są zatwierdzane razem.
- Błąd dowolnego zapisu magazynowego przerywa finalizację i wycofuje wcześniejsze
  zmiany. Po udanym commitcie nadal wykonywane są metryka, log zakończenia oraz
  powiadomienie follow-up.
- Test warstwy magazynowej potwierdza, że przekazany menedżer omija wewnętrzne
  `DataSource.transaction`.

## Validation

- Rytuał fail-first: 2 nowe testy FAIL przed zmianą — w obu przypadkach
  otrzymano `completed` zamiast oczekiwanego `scheduled`.
- Testy celowane: 2 zestawy / 49 testów PASS.
- Backend: 44 zestawy / 354 testy PASS.
- Izolowany PostgreSQL 15: test dwóch równoczesnych rezerwacji 1/1 PASS.
- TypeScript typecheck: PASS; build NestJS: PASS.
- ESLint backendu: 0 błędów, 153 istniejące ostrzeżenia. Automatyczne zmiany
  formatowania 69 niezwiązanych plików wycofano; diff przed i po lint dla
  pięciu zamierzonych plików był identyczny.
- `git diff --check`: PASS.

## Rollout

Oczekuje na commit, CI, Deploy i weryfikację API.

Rollback: revert changesetu i ponowne wdrożenie API. Przywróci to możliwość
częściowego zakończenia wizyty, dlatego preferowany jest minimalny forward fix.

## Follow-up

Uzgodnić osobne znaczenie zgód marketingowych i powiadomień obsługowych, potem
dodać niezawodną politykę kanałów dla potwierdzenia, przełożenia, anulowania i
przypomnień. Osobno objąć blokadą równoczesne przełożenie terminu.
