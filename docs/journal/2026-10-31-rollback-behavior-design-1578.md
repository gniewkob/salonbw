# Rollback API #1578: projekt wariantu regresji

- **Data:** 2026-10-31; **agent:** Codex; **PR:** brak.

## Finding
Manifest #1576 nie cofa potencjalnej regresji tego samego grafu. Workflow zmienia `.env`, uruchamia migracje oraz synchronizuje `dist` z usuwaniem. `APP_RELEASE` pochodzi ze środowiska procesu. Pochodzenie dodatkowego `dist/migrate.js` pozostaje nieznane.

## Change
Runbook opisuje wariant C, warunki zachowania danych i schematu, źródło release i dwukierunkowy drill. C nie jest gotowym artefaktem: wymagane zachowanie nie zidentyfikowano, więc poprawka nie jest wybrana.

## Validation
Lokalnie w katalogu tymczasowym: bramka manifestu z `1ced2e70` przyjęła manifest tego SHA i odrzuciła manifest `b208e36e`. Syntetyczny `rsync --delete` usunął nieznany plik w `dist`, zachowując syntetyczne markery `.env`, uploads i DB poza katalogiem. To nie jest test produkcyjnej procedury, Passenger, DB, FreeBSD ani poprawności zachowania API. Uprzedni test FreeBSD dotyczył innej próby opisanej w poprzednim dzienniku.

## Rollout / follow-up
Brak produkcji, wdrożenia, migracji, restartu i merge. `ROLLBACK_PREFLIGHT=BLOCKED`. Następnie zidentyfikować scenariusz regresji, zbudować i przetestować poprawkę i artefakt, wyjaśnić plik, wykazać kompatybilność schematu oraz marker release.
