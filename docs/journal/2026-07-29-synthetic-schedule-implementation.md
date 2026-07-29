# Zgodność syntetycznych wizyt z grafikiem

- **Data:** 2026-07-29
- **Agent:** Codex
- **Commit(y):** ten commit, `docs: document schedule-aware synthetic data`;
  poprzedzające commity implementacyjne `1eebc82d`, `ef08dd8c`, `029c6003`,
  `e5341485`, `78073921`, `028abe0d`, `9a95a67d`
- **PR:** brak

## Finding

Podczas produkcyjnego UAT kalendarza znaleziono syntetyczne wizyty w środę,
mimo że widok poprawnie oznaczał salon jako zamknięty. Generator układał wizyty
według własnych offsetów zamiast aktywnego grafiku ownera. Ten etap nie
odczytywał ponownie produkcji; finding pochodzi z wcześniejszego,
udokumentowanego UAT.

## Change

- Aktywny grafik Oli — regularne zakresy, przerwy i wyjątki — jest jedynym
  źródłem prawdy dla syntetycznych wizyt. Nie ma fallbacku do godzin oddziału
  ani zakodowanych dni tygodnia.
- `custom_hours` całkowicie zastępuje dany dzień i nie dziedziczy tygodniowych
  przerw.
- Generator alokuje wizyty tylko w dozwolonych zakresach, nie nakłada ich na
  siebie i przenosi niedozwolone `in_progress` do przyszłości jako `confirmed`.
- Niezależny validator działa przed transakcją; `apply` dodatkowo weryfikuje
  zapisane wiersze przed commitem i wykonuje rollback po blockerze.
- CLI zachowuje kompatybilny raport liczności, dodaje wyłącznie agregat
  `plan.scheduleSummary` i raportuje `verification.scheduleViolations`.
  Nie ujawnia surowych godzin, rekordów grafiku ani danych osobowych.
- Dokumentacja operatorska rozdziela odczytowe `plan`/`verify` od pojedynczego,
  jawnie zatwierdzonego `apply`.

Zmienione w Task 6:

- `backend/salonbw-backend/scripts/synthetic-prelive-data.ts`
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-prelive-data.cli.spec.ts`
- `docs/SYNTHETIC_PRELIVE_DATA.md`
- `docs/PROJECT_STATE.md`
- `docs/journal/2026-07-29-synthetic-schedule-implementation.md`

## Fail-first evidence

Wszystkie komendy Jest uruchamiano bez zbędnego, samodzielnego separatora
`--`.

- **Task 1:** brak modułu resolvera; `1 failed suite`. GREEN: `1 suite`,
  `7/7 tests`.
- **Task 2:** stary generator ignorował grafik, przerwy, pojemność i kolizje;
  `1 suite`, `5 failed`, `9 passed`, `14 total`. GREEN: `14/14`.
- **Task 3:** brak niezależnego validatora; `1 failed suite`. Dwie późniejsze
  rundy regresyjne wykazały po `3 failed` przy `11` i `13` testach. Final
  GREEN: `13/13`.
- **Task 4:** brak loaderów i weryfikacji grafiku; `1 suite`, `7 failed`,
  `10 passed`, `17 total`. GREEN: `17/17`.
- **Task 5:** brak walidacji przed transakcją i błędna ścieżka cleanup;
  `1 suite`, `4 failed`, `4 passed`, `8 total`. Mutacja kontrolna wywołania
  weryfikacji po insercie dała `1 failed`, `7 passed`. Final GREEN dla sześciu
  suite integracyjnych: `63/63`.
- **Task 6:** publiczny JSON pomijał `plan.scheduleSummary`; `1 suite`,
  `1 failed`, `3 passed`, `4 total`. GREEN: `1 suite`, `4/4`.

## Validation

- `pnpm --filter salonbw-backend test --runInBand`: exit `0`; `42/42` suite,
  `319/319` testów, `0` snapshotów, `12.087 s`. Zastane testy ścieżek błędu
  wypisały oczekiwane logi WhatsApp i kontrolera klientów; nie było porażki.
- `pnpm --filter salonbw-backend typecheck`: exit `0`; TypeScript bez błędów.
- `pnpm --filter salonbw-backend lint`: exit `0`; `0 errors`, `176 warnings`.
  Są to zastane ostrzeżenia. Wbudowane `--fix` zmieniło mechanicznie pliki poza
  zakresem; wszystkie te zmiany cofnięto, zachowując wyłącznie pięć plików
  Task 6.
- `pnpm --dir backend/salonbw-backend exec eslint
  scripts/synthetic-prelive-data.ts`: exit `0`, bez outputu.
- `pnpm --dir backend/salonbw-backend exec prettier --check
  scripts/synthetic-prelive-data.ts
  src/database/synthetic-data/synthetic-prelive-data.cli.spec.ts`: exit `0`;
  oba pliki zgodne.
- `pnpm --filter salonbw-backend build`: exit `0`; `nest build`.
- `git diff --check`: exit `0`, bez outputu.
- `scripts/handoff-check.sh` przed commitem: exit `1`, ponieważ skrypt sprawdza
  wyłącznie `origin/master...HEAD` i nie widzi poprawnych dokumentów w working
  tree. Po commicie: exit `0`,
  `handoff-check: OK — praca jest przekazywalna.`.

Nie uruchomiono żadnej komendy syntetycznych danych ani nie uzyskano dostępu do
produkcyjnej bazy. Nie wykonano `plan`, `verify`, `apply` ani `cleanup`.

## Rollout

Nie wykonano pushu, monitoringu CI/deployu ani produkcyjnego `plan`/`verify`.
Kroki 7–8 planu są jawnie odroczone i należą do controllera po finalnym
przeglądzie całej gałęzi. To nie jest zakończony rollout.

## Follow-up

Controller wykonuje finalny przegląd całej gałęzi i deploy kodu. Następna
operacja produkcyjna to wyłącznie odczytowy `synthetic:data:plan` oraz
przedstawienie agregatowego raportu ownerowi. Dopiero nowa, osobna zgoda ownera
i świeży, zweryfikowany `pg_dump` mogą otworzyć dokładnie jedno `apply`, po
którym wymagane są `verify`, `/healthz`, kontrola kalendarza i ponowna rotacja
hasła bazy.
