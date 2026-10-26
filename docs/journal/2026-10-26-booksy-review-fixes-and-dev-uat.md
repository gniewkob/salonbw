# Booksy: poprawki review #1521 i próba UAT dev

- Data: 2026-10-26
- Agent: Codex
- PR: #1521
- Baza: `8aa1c7b864bd577d84c2df319ab3e09d9bda1eb6`
- Izolacja: osobny worktree `salonbw-booksy-review-fixes`, gałąź
  `codex/booksy-review-fixes-20261026`; checkout ownera nietknięty.

## Finding

Dwa otwarte wątki Codex review odtworzone testami: aliasy z inną wielkością
liter/whitespace dawały fałszywy drift oraz pomijały kolizje; link jednej/obu
wizyt usuwał kolizję źródłową. Nowe regresje: 6 FAIL / 20 PASS / 1 opt-in skip
przed zmianą kodu. Sprawdzono oba nowe skrypty, oba nowe pliki testów oraz
krok CI przygotowujący jednorazową bazę cleanupu. Nie zmieniano funkcji cleanupu.

## Change

- Mapowanie aliasów i nazwy pracowników używają reguł `staffKey` importera:
  trim, redukcja whitespace, `toLocaleLowerCase('pl-PL')`; ostatni
  znormalizowany alias wygrywa jak w importerze.
- `sourceIntervals` powstaje przed pominięciem linked bookings.
  Porównania target delta nadal wykonują się tylko dla unlinked bookings.
- 8 dodatkowych przypadków: case/whitespace/Polish/tab, powtórzony alias,
  0/1/2 powiązane wizyty, wyłączenie anulowanych/przeszłych/innego pracownika
  i sąsiadujących interwałów. Łącznie raport jednostkowo 26/26 PASS.

## Validation

- `pnpm install --frozen-lockfile --ignore-scripts`: PASS, bez nowych zależności.
- `pnpm --filter salonbw-backend run build`: PASS.
- `pnpm --filter salonbw-backend run typecheck`: PASS.
- Pełny Jest z CLEANUP_TEST_DATABASE_URL i BOOKSY_TEST_DATABASE_URL:
  **65 suites, 526/526 PASS, bez skipów** (20.145 s).
- `jest --config test/jest-e2e.json --runInBand --testRegex
  'appointments-concurrency\.pg-spec\.ts$'`: **12/12 PASS** (10.756 s).
- Integracje wyłącznie na nowym lokalnym kontenerze PostgreSQL 16,
  loopback 53891, bazy cleanup_synthetic/booksy_synthetic/salonbw_test.
  Brak produkcyjnego eksportu i danych klientek.
- Lint backendu: exit 0, 0 errors / 151 zastanych warnings. Komenda repo
  zawiera --fix; wygenerowane zmiany poza zakresem przywrócono wyłącznie
  w nowym worktree. Osobny lint obu skryptów PASS.
- Zwykły type-aware ESLint wyklucza specs z tsconfig (parser error);
  specs sprawdzono przez ESLint API z `disableTypeChecked` wyłącznie dla
  `**/*.spec.ts`: 0 errors / 0 warnings. Jest kompiluje i wykonuje testy.
- `git diff --check`: PASS.

## UAT dev: PARTIAL / BLOCKED

- Próba przeglądarkowa `https://dev.salon-bw.pl`:
  `ERR_INVALID_AUTH_CREDENTIALS` na gateway Basic Auth.
- Niezależne GET landing, panel i `/services/public` dev API: każde 401.
- Odczyt konfiguracji na hoście API dev, tylko wynik boolean:
  APP_ENV=development, nazwa bazy dev zgodna, OUTBOUND_DELIVERY_ENABLED=false,
  SMSAPI_ENABLED=false. Wartości sekretów nie odczytywane do raportu.
- Nie wykonano wyboru usługi/terminu, auth/register, booking ani statusu salon.
  Brak uwierzytelnionej sesji gateway blokuje ocenę całej ścieżki.
- Nie zmieniano konfiguracji, kont, haseł, danych ani wdrożenia dev/prod.
  Testy lokalne nie są akceptacją hostowanego dev.

## Rollout / controls

Poprawki zostaną dopisane do istniejącego PR, bez merge/deploy produkcyjnego.
Wyniki CI i linki do runów będą zapisane w komentarzu PR po pushu.
Rollback kodu: revert dedykowanego commita. Schemat i API bez zmian.
Przegląd skryptów nie stanowi pełnego audytu bezpieczeństwa cleanup apply.

## Follow-up

1. Sprawdzić CI dokładnego SHA poprawki i automatyczny review.
2. Operator: udostępnić uwierzytelnioną sesję dev bez wklejania sekretów,
   następnie wykonać pełną ścieżkę na kontach syntetycznych z wyłączonymi
   wysyłkami, odnotować status rezerwacji w panelu salonu.
3. Cleanup produkcji: **plan-only**, 21/70 to historyczny plan, nie dzisiejszy
   pomiar. Nie wykonano apply. Nie ma finalnego importu ani GO na wyłączenie
   Booksy; wymagany świeży eksport i biznesowe rozstrzygnięcie wyjątków.
