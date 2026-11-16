# Studio V18 — bezpieczne seedowanie bazy browser UAT

- Data: 2026-11-14.
- PR: [#1705](https://github.com/gniewkob/salonbw/pull/1705) (Draft).
- Zakres: fixture QA, bez zmian runtime panelu, API, produkcji, uprawnień DB i cache.

## Finding

Skrypt `backend/salonbw-backend/scripts/qa-owner-browser-postgres.ts` używał `dropSchema: mode === 'seed'` i bezwzględnie oczekiwał dostępnej bazy `salonbw_browser_uat` na `127.0.0.1:5432`. Na komputerze właściciela lokalny port 5432 jest zajęty przez inną usługę. Same zmienne `GITHUB_ACTIONS` i `CI` oraz zgodny connection string nie dowodzą, że instancja jest pusta i jednorazowa. Seed uruchomiony w błędnym środowisku mógłby skasować istniejący schemat.

Istniejący pełny real-stack UAT nie jest zatwierdzony do uruchamiania na hoście właściciela; osobny problem PostgreSQL `PUBLIC CONNECT` opisuje [#1706](https://github.com/gniewkob/salonbw/issues/1706).

## Change

- Fixture nie używa już `dropSchema` w żadnym trybie; `dropSchema: false`.
- Przed migracjami `seed` rozpoczyna krótką transakcję `READ ONLY` i kontroluje `current_database`, `current_user`, flagę read-only, liczbę obiektów użytkownika oraz dodatkowych schematów w `pg_catalog`.
- Każda niezgodność lub błąd łączności przerywa seedowanie, zanim TypeORM uruchomi migracje.
- Zewnętrzne wyjątki fixture nie drukują już metadanych połączenia ani sekretów.
- Zachowany wymóg GitHub Actions, dokładnego testowego connection stringa oraz wyłączonych transportów outbound/SMS.
- Dodano regresję **tylko kontraktu źródłowego** `scripts/ci/qa-owner-browser-pg-safety.test.mjs`; to nie jest test zachowania PostgreSQL.

## Validation

- Odczyt GitHub po commitach potwierdził `dropSchema: false`, wywołanie preflight przed `new DataSource`, obecność transakcji read-only, sprawdzanie pustych obiektów i zabezpieczeń CI.
- 7/7 kontroli struktury tekstu źródłowego w sesji API — PASS (bez użycia rzeczywistej bazy).
- **Nie uruchomiono** `node --test`, kompilacji TypeScript, migracji ani Playwright na nowym SHA w środowisku z dostępem do repo. Wynik local/SSH sprzed zmiany nie może być automatycznie przypisany temu commitowi.
- Brak GitHub Actions dla tego SHA, brak deploy, merge, restartów, zmian uprawnień i produkcyjnych danych.

## Rollout

Nie dotyczy — zmiana dotyczy skryptu QA. PR pozostaje Draft / DEV i PROD **NO-GO**.

## Follow-up

1. W osobnym worktree uruchomić `node --test scripts/ci/qa-owner-browser-pg-safety.test.mjs`, backend typecheck i testy fixture na całkowicie izolowanej, świeżej bazie Docker.
2. Wykazać negatywny przypadek: istniejąca testowa tabela powoduje `OWNER_BROWSER_PG_BLOCKED`, a jej dane pozostają nienaruszone. Test wyłącznie w disposable PostgreSQL.
3. Przenieść real-stack UAT do zamkniętej sieci Docker bez publikacji portu 5432 na hoście, z jednoznacznym zaświadczeniem jednorazowego celu testowego. Nie rozluźniać zabezpieczeń GitHub-hosted fixture tylko przez zmianę flag `CI`.
4. Zamknąć P0 uprawnień DB [#1706](https://github.com/gniewkob/salonbw/issues/1706) i wykonać pełny kalendarz/drag-and-drop/CRM UAT [#1531](https://github.com/gniewkob/salonbw/issues/1531).
