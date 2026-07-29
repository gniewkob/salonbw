# Rotacja poświadczenia PostgreSQL

- **Data:** 2026-07-29
- **Agent:** Codex
- **Commit(y):** `00ea0e94`
- **PR:** brak

## Finding

Podczas lokalnej diagnostyki E4.2 wartość `DATABASE_URL` została wypisana do
wyjścia narzędzia. Zgodnie z polityką repo poświadczenie uznano za
skompromitowane i wstrzymano dalsze prace do czasu jawnej zgody ownera.

## Change

Po zgodzie ownera obrócono hasło konta PostgreSQL. Bez ujawniania wartości
zsynchronizowano produkcyjny `.env` API, lokalny ignorowany `.env` oraz sekrety
GitHub Actions: `DATABASE_URL`, `MYDEVIL_DB_PASSWORD` i `PGPASSWORD`.
Produkcyjny env został zaktualizowany przez `safe-update-api-env.sh`, który
utworzył automatyczne kopie bezpieczeństwa. API następnie zrestartowano.

## Validation

- nowe poświadczenie: połączenie i `SELECT 1` — sukces;
- stare poświadczenie: nowe połączenie odrzucone kodem PostgreSQL `28P01`;
- produkcyjny `DATABASE_URL` i `PGPASSWORD`: zgodne;
- GitHub Actions: wszystkie trzy sekrety mają nowy timestamp aktualizacji;
- `/healthz`: `status=ok`, `database=ok`;
- tymczasowy plik odzyskiwania: usunięty po pełnej walidacji;
- `.env`: nadal ignorowany przez git.

## Rollout

CI `30435684106`, automatyczny Deploy `30435686421` i kontrolny Deploy API
`30435688099` zakończyły się sukcesem. Kontrolny deploy przeszedł przygotowanie
produkcyjnego env, połączenie migratora z bazą, restart API i health-check.

## Follow-up

Po zielonym deployu wrócić do pełnego diffu FK dla E4.2. Nie ponawiać
`synthetic:data:apply` bez nowej jawnej zgody ownera.
