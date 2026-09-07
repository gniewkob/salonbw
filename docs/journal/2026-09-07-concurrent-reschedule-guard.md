# Ochrona przed równoczesnym przełożeniem na ten sam termin

- **Data:** 2026-09-07
- **Agent:** Codex
- **Commit(y):** `e8679346` + dokumentacja wyników; punkt wyjścia `269e46ee`
- **PR:** brak; master

## Finding

Obie ścieżki zmiany terminu sprawdzały konflikt przed osobnym `UPDATE`.
Przy wyłączonym nakładaniu dwa równoczesne przełożenia różnych wizyt mogły
zobaczyć wolny termin i oba go zapisać.

Test fail-first na PostgreSQL 15 uruchomił dwa przełożenia na ten sam termin,
z kontrolowanym opóźnieniem aktualizacji. Bez poprawki oba żądania zakończyły
się sukcesem i powstały dwie nakładające się wizyty. Test jawnie wyłącza
`allowOverlappingAppointments`; gdy to ustawienie jest włączone, nakładanie
pozostaje zamierzonym zachowaniem biznesowym.

Nie odczytywano ani nie modyfikowano danych produkcyjnych.

## Change

- Dodano wspólną transakcyjną metodę aktualizacji harmonogramu.
- Gdy nakładanie jest wyłączone, metoda blokuje rekord docelowej osoby przez
  PostgreSQL `SELECT ... FOR UPDATE`, ponownie sprawdza konflikt w tej samej
  transakcji i dopiero aktualizuje wizytę.
- Ochroną objęto `updateStartTime()` i `reschedule()`.
- Jawne `force` oraz włączone `allowOverlappingAppointments` zachowują
  dotychczasowe pominięcie kontroli konfliktu.
- PostgreSQLowy test CI obejmuje teraz równoczesną rezerwację i przełożenie.

## Validation

- Rytuał fail-first przy wyłączonym nakładaniu: przed zmianą test FAIL —
  2 sukcesy i 2 wizyty w tym samym terminie; po zmianie 1 sukces,
  1 `ConflictException` i 1 zapis.
- Izolowany PostgreSQL 15: 2/2 testy współbieżności PASS.
- Backend: 44 zestawy / 354 testy PASS.
- TypeScript typecheck: PASS; build NestJS: PASS.
- ESLint backendu: 0 błędów, 153 istniejące ostrzeżenia. Automatyczne zmiany
  formatowania 69 niezwiązanych plików wycofano; diff przed i po lint dla
  zamierzonych plików był identyczny.
- `git diff --check`: PASS.

## Rollout

- Commit `e8679346`: [CI 34109975218](https://github.com/gniewkob/salonbw/actions/runs/34109975218)
  i [Deploy 34109975329](https://github.com/gniewkob/salonbw/actions/runs/34109975329)
  completed/success. CI uruchomił oba testy współbieżności na PostgreSQL 15.
- Health API 2026-09-07 10:15 UTC: HTTP 200; database, smtp i instagram `ok`.
- W kodzie wykonywanym na API potwierdzono `updateAppointmentSchedule()`,
  blokadę harmonogramu oraz użycie jej przez obie ścieżki przełożenia.

Rollback: revert changesetu i ponowne wdrożenie API. Przywróci to wyścig przy
równoczesnej zmianie terminu, więc preferowany jest minimalny forward fix.

## Follow-up

Uzgodnić rozdzielenie zgód marketingowych od powiadomień obsługowych, następnie
wdrożyć i przetestować politykę kanałów dla potwierdzenia, przełożenia,
anulowania i przypomnień.
