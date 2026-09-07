# Ochrona przed równoczesną rezerwacją jednego terminu

- **Data:** 2026-09-07
- **Agent:** Codex
- **Commit(y):** `5620f3b8` + dokumentacja wyników; punkt wyjścia `ccdf606c`
- **PR:** brak; master

## Finding

`AppointmentsService.create()` wykonywał zapytanie o konflikt, a potem osobny
insert bez wspólnej transakcji i blokady. Test z dwoma równoczesnymi wywołaniami
na świeżym PostgreSQL 15, z krótkim opóźnieniem inserta w triggerze testowym,
zapisał dwie wizyty `online_pending` dla tej samej osoby i tego samego czasu.
Test przed poprawką: FAIL, dwa wywołania spełnione i dwa rekordy.

Sekwencyjny test konfliktu był zielony, ale nie obejmował okna między SELECT
i INSERT. Produkcyjnych danych nie odczytywano ani nie zmieniano.

## Change

- Dla zapisów bez dozwolonego nakładania `create()` otwiera transakcję,
  blokuje rekord pracownika przez PostgreSQL `SELECT ... FOR UPDATE`, ponownie
  sprawdza zakres czasu na repozytorium tej transakcji i zapisuje wizytę.
- Jeśli personel ma świadomie włączone nakładanie wizyt, dotychczasowa ścieżka
  pozostaje bez blokady i bez odrzucania konfliktu.
- CI uruchamia PostgreSQL 15 i obowiązkowy test współbieżności backendu.
- Testowe repozytorium in-memory odzwierciedla teraz transakcyjne repozytorium;
  nie zmienia to zachowania produkcyjnego.

## Validation

- Test PostgreSQL fail-first: przed zmianą 2 zapisane wizyty, oczekiwano 1.
- Ten sam test po zmianie: 1/1 PASS; jeden zapis i jeden `ConflictException`.
- Backend: 44 zestawy / 352 testy jednostkowe PASS.
- Pełny TypeScript `tsc --noEmit`: PASS; build NestJS: PASS.
- ESLint backendu: 0 błędów, 153 istniejące ostrzeżenia. Zmiany formatowania
  69 niezwiązanych plików zostały wycofane po potwierdzeniu identycznego kodu
  wynikowego; changeset pozostaje ograniczony do rezerwacji i CI.

## Rollout

- Commit `5620f3b8`: [CI 34104575891](https://github.com/gniewkob/salonbw/actions/runs/34104575891)
  i [Deploy 34104575839](https://github.com/gniewkob/salonbw/actions/runs/34104575839)
  completed/success. Backend CI uruchomił nowy PostgreSQL 15 i test
  współbieżności.
- W kodzie wykonywanym na API potwierdzono zapytanie `FOR UPDATE`.
- Health API 2026-09-07 09:13 UTC: HTTP 200, database/smtp/instagram ok.

Rollback: revert changesetu i ponowne wdrożenie API; przywróci podatność na
podwójną rezerwację, więc preferowany jest minimalny forward fix.

## Follow-up

Objąć analogiczną transakcją ścieżki przełożenia terminu, gdy nakładanie jest
wyłączone. Następnie sprawdzić awarie powiadomień i atomowość rozliczenia.
