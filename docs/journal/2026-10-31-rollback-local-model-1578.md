# #1578 — zatwierdzony lokalny model odzyskiwania

- **Data:** 2026-10-31; **agent:** Codex; **PR:** brak.

## Finding
Skrypt snapshotu DEV przywraca `.env`; nie ma sprawdzonego mechanizmu API-only z niezmienną konfiguracją.

## Change
Po wyraźnej zgodzie właściciela dodano samodzielny testowy model w `scripts/ci/api-recovery-prototype.test.cjs`. Wszystkie ścieżki i treści pochodzą z syntetycznych katalogów tymczasowych; brak integracji z workflow, siecią, API, DB i Passenger.

## Validation
`/opt/homebrew/opt/node@22/bin/node --test scripts/ci/api-recovery-prototype.test.cjs`: 7/7 PASS. Scenariusze: dwukierunkowe przełączenie, niezmienność syntetycznych danych, błędne ID, pliki i dowiązania, błąd przed/po zmianie, kontrola powrotu. `git diff --check`: PASS.

## Rollout / follow-up
Brak rollout; model używa znacznika zamiast aktywacji runtime i nie dowodzi zachowania na FreeBSD/Passenger, spójności DB, pochodzenia artefaktów, odporności na współbieżność czy awarie. `ROLLBACK_PREFLIGHT=BLOCKED`. Potrzebny osobny projekt i próby faktycznej aktywacji oraz pozostałe bramki runbooka.
