# Ochrona przed równoczesną rezerwacją jednego terminu

- **Data:** 2026-09-07
- **Agent:** Codex
- **Commit(y):** commit zawierający ten wpis; punkt wyjścia `ccdf606c`
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

W toku. Przed zamknięciem: handoff-check, commit/push, CI i Deploy success,
health API oraz potwierdzenie obecności blokady w wdrożonym pliku wykonywanym.
Rollback: revert changesetu i ponowne wdrożenie API; przywróci podatność na
podwójną rezerwację, więc preferowany jest minimalny forward fix.

## Follow-up

Objąć analogiczną transakcją ścieżki przełożenia terminu, gdy nakładanie jest
wyłączone. Następnie sprawdzić awarie powiadomień i atomowość rozliczenia.
