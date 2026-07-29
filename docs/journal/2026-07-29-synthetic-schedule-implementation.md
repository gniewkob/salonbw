# Zgodność syntetycznych wizyt z grafikiem

- **Data:** 2026-07-29
- **Agent:** Codex
- **Commit(y):** `1eebc82d`, `ef08dd8c`, `029c6003`, `e5341485`,
  `78073921`, `028abe0d`, `9a95a67d`, `c3e8554f`, `1f91b81d` oraz ten finalny
  commit naprawczy (`fix(backend): harden schedule-aware synthetic data`)
- **PR:** brak

## Finding

Podczas produkcyjnego UAT kalendarza znaleziono syntetyczne wizyty w środę,
mimo że widok poprawnie oznaczał salon jako zamknięty. Generator układał wizyty
według własnych offsetów zamiast aktywnego grafiku ownera. Ten etap nie
odczytywał ponownie produkcji; finding pochodzi z wcześniejszego,
udokumentowanego UAT.

Finalny przegląd całej gałęzi wykazał ponadto cztery problemy bezpieczeństwa:
samodzielny `verify` starzał poprawne statusy względem nowej chwili i budował
grafik wyłącznie wokół nowej kotwicy; konwersja czasu mogła rzucić wyjątek w
luce DST albo zmienić czas trwania podczas fold; błędny starszy grafik blokował
poprawny nowszy; oraz odczyty `verify` i grafik używany przez `apply` nie
tworzyły spójnego snapshotu.

## Change

- Aktywny grafik Oli — regularne zakresy, przerwy i wyjątki — jest jedynym
  źródłem prawdy dla syntetycznych wizyt. Nie ma fallbacku do godzin oddziału
  ani zakodowanych dni tygodnia.
- `custom_hours` całkowicie zastępuje dany dzień i nie dziedziczy tygodniowych
  przerw.
- Generator alokuje wizyty tylko w dozwolonych zakresach, nie nakłada ich na
  siebie i przenosi niedozwolone `in_progress` do przyszłości jako `confirmed`.
- Kandydaci w luce/fold DST są pomijani, jeśli konwersja ścienna jest
  niepoprawna, zmienia deklarowany czas 30/60/90 minut albo przenosi endpoint
  poza ten sam lokalny zakres; brak dalszej pojemności daje stabilny blocker.
- Resolver najpierw wybiera obowiązujący grafik po `validFrom`/`id`, a dopiero
  potem waliduje jego sloty i wyjątek wybranej daty. Błędny, całkowicie
  przesłonięty starszy rekord nie blokuje nowszego grafiku.
- Samodzielny `verify` używa jednej transakcji
  `REPEATABLE READ READ ONLY`, pobiera rzeczywisty zakres dat zapisanych
  wizyt i pomija wyłącznie klasyfikację statusu względem nowej chwili. Nadal
  sprawdza daty, pracownika, zawarcie w grafiku i kolizje.
- `apply` zachowuje preflight, po czym w transakcji blokuje zapisy do trzech
  tabel grafiku, ponownie odczytuje kontekst/grafik, regeneruje i rygorystycznie
  waliduje dataset. Reset, insert i weryfikacja używają zablokowanego planu;
  błąd grafiku, walidacji albo weryfikacji wykonuje rollback.
- CLI zachowuje kompatybilny raport liczności, dodaje wyłącznie agregat
  `plan.scheduleSummary` i raportuje `verification.scheduleViolations`.
  Nie ujawnia surowych godzin, rekordów grafiku ani danych osobowych.
- Dokumentacja operatorska rozdziela odczytowe `plan`/`verify` od pojedynczego,
  jawnie zatwierdzonego `apply`.

Zmienione w finalnej fali naprawczej:

- `backend/salonbw-backend/scripts/synthetic-prelive-data.ts`
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.ts`
  i `.spec.ts`
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.schedule.ts`
  i `.spec.ts`
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.ts`
  i `.spec.ts`
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.ts`
  i `.spec.ts`
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts`
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.validation.ts`
  i `.spec.ts`
- `docs/SYNTHETIC_PRELIVE_DATA.md`
- `docs/PROJECT_STATE.md`
- `docs/superpowers/plans/2026-07-29-synthetic-schedule-alignment.md`
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
- **Finalna fala — resolver/alokator/validator:** regresje statusu persistent,
  jawnego zakresu dat, shadowed timetable oraz gap/fold DST dały RED:
  `3 failed suites`, `5 failed`, `34 passed`, `39 total`. Po zmianie GREEN:
  `3/3 suites`, `39/39`.
- **Finalna fala — store/service:** brak loadera rzeczywistego zakresu,
  blokad grafiku, spójnej transakcji `verify` i regeneracji `apply` pod blokadą
  dał RED: `2 failed suites`, `13 failed`, `20 passed`, `33 total`. Po zmianie
  store/service/CLI: GREEN `3/3 suites`, `37/37`.
- **Finalny zestaw celowany:** `6/6 suites`, `76/76 tests`, `0` snapshotów.

## Validation

- `pnpm --filter salonbw-backend test --runInBand`: exit `0`; `42/42` suite,
  `332/332` testów, `0` snapshotów, `11.897 s`. Zastane testy ścieżek błędu
  wypisały oczekiwane logi WhatsApp i kontrolera klientów; nie było porażki.
- `pnpm --filter salonbw-backend typecheck`: exit `0`; TypeScript bez błędów.
- `pnpm --filter salonbw-backend lint`: exit `0`; `0 errors`, `176 warnings`.
  Są to zastane ostrzeżenia. Wbudowane `--fix` zmieniło mechanicznie pliki poza
  zakresem; wszystkie te zmiany cofnięto, zachowując wyłącznie pliki finalnej
  fali.
- `pnpm --dir backend/salonbw-backend exec eslint
  <zmienione pliki produkcyjne i skrypt CLI>`: exit `0`, bez outputu.
- `pnpm --dir backend/salonbw-backend exec prettier --check
  <12 zmienionych plików TypeScript>`: exit `0`; wszystkie zgodne.
- `pnpm --filter salonbw-backend build`: exit `0`; `nest build`.
- `git diff --check`: exit `0`, bez outputu po zmianach kodu i dokumentacji.
- `scripts/handoff-check.sh`: exit `0`;
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
