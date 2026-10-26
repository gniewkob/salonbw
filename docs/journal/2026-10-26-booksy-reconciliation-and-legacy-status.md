# Booksy: uzgodnienie przed migracją i status wycofania PHP

- **Data:** 2026-10-26
- **Agent:** Codex
- **Gałąź:** `codex/booksy-reconciliation-20261026`, baza `0b1732e5`
- **PR:** [#1521](https://github.com/gniewkob/salonbw/pull/1521); bez merge ani importu produkcyjnego

## Finding

Lokalny master jest starszy i zawiera niezapisane zmiany. Nie wykonano checkout,
stash, reset, clean ani nadpisania; utworzono osobny worktree.
Bieżące docs na origin/master zawierały także historyczne i sprzeczne opisy:
„91 przyszłych” oraz UAT zapisujące na produkcji mimo osobnego dev.

### Legacy i PR-y

Odczytano wynik Work „Audit and retire legacy PHP landing”
(`01a177ae-4701-7c53-9cf6-3a510da957b0`). Work wykonał przez SSH skrypt z
`b8c3eb5c`: usunięto public_html (1663 pliki, 77 MB), bez pasujących archiwów.
Work zweryfikował 54 stare ścieżki (53 przekierowania) i niezmieniony Next build.
Dziś niezależny odczyt potwierdził brak public_html / legacy-salon-bw-*,
symlink salonbw_prod, obecność Next BUILD_ID oraz WWW type=nodejs.
Sprawdzono live home/legal/booking/panel/API: 200 po właściwych redirectach.
Nie wykonywano żadnego kasowania w tym zadaniu. Nie przeprowadzono pełnej
inwentaryzacji wszystkich innych prywatnych kopii na koncie.

[PR #1519](https://github.com/gniewkob/salonbw/pull/1519): OPEN, SHA `41cfd131`,
CI success, usuwa martwy element komunikacji i zmienia CTA 404 na `/booking`.
Wymaga osobnego merge po akceptacji; produkcja nie zawiera jeszcze tej zmiany.
[PR #1520](https://github.com/gniewkob/salonbw/pull/1520): OPEN, SHA `b8c3eb5c`,
CI success. Skrypt został wykonany bez merge; merge służy zapisowi skryptu i
prawidłowej dokumentacji, a nie ponownemu usuwaniu. Jego opis wykonania jest
nieaktualny. Błąd claude-review to `is_error:true` / directory mismatch, nie
ustalenie luki i nie ukończony security review. Nie scalano żadnego PR.
Master uruchamia automatyczny deploy produkcyjny, więc merge pozostaje bramką.

### Dane i granice dowodu

Jedyny odnaleziony eksport appointments.csv: lokalny temp_export_pl-101016,
mtime 2026-10-23 12:59; to metadane pliku, nie dowód momentu/kompletności eksportu.
SHA256 treści: `07b96019d219fed1140545ceb0927ccffa27bc7aaa957a435b9e21027b8c914a`.
Nie było dostępnego świeższego eksportu. Nie odczytywano ani nie przenoszono
PII do dev, GitHub, Postmana lub treści raportu. CSV strumieniowano do procesu
na MyDevil; do planu importera wymagane dwa pliki trafiły na krótko do prywatnego
katalogu aplikacji (700, pliki 600), potem usunięto je.

Read-only snapshot bazy o czasie raportu `2026-10-26 11:23:19 Europe/Warsaw`:

| Kontrola | Wynik |
| --- | ---: |
| Wiersze wizyt źródłowych | 13 461 |
| Powtórzone source booking ID / niepoprawne daty / nieznane statusy | 0 / 0 / 0 |
| Przyszłe confirmed wg tego snapshotu | 85 |
| Z kartą klientki / anonimowe | 82 / 3 |
| Powiązane z celem / brakujące | 0 / 85 |
| Brak client link (wszystkie anonimowe) | 3 |
| Aktywne przyszłe wizyty w SalonBW | 0 |
| Kolizje z celem / dokładni kandydaci na duplikat bez linku | 0 / 0 |
| Pary nakładania w źródle / różne dotknięte wizyty | 7 / 12 |
| Pary nakładania obejmujące anonimowe wizyty | 0 |
| Niejasny pracownik przyszłej wizyty / dangling source visit link / linked drift | 0 / 0 / 0 |

Nakładanie oznacza przecinanie przedziałów u tego samego pracownika, z wyłączeniem
stykających się końców. Nie dowodzi błędu: owner musi rozstrzygnąć dozwolone
nakładanie np. podczas koloryzacji. Raport nie porównuje notatek, cen, zgód ani
zmian usług w już powiązanych wizytach. Nie jest pełnym audytem wszystkich pól.

Oryginalny importer uruchomiono WYŁĄCZNIE jako plan, z
`PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=30000'`,
`IMPORT_BOOKSY_APPLY=0`, `INCLUDE_FUTURE=1`, `ANONYMOUS=0`,
`RESET_CLIENT_PASSWORDS=0`. Zachowano udokumentowane historyczne mapowanie
aliasów personelu na owner account; wartości i nazwy nie trafiły do raportu.
Wynik: 1047/1047 klientek alreadyImported, 0 nowych; 10 109 wizyt alreadyImported,
91 proposed confirmed, 0 konfliktów importera i 0 resetów haseł.

**91 proposed ≠ 91 nadal przyszłych:** 82 przyszłe z klientką + 9 przeszłych
confirmed. 3 przyszłe anonimowe są pomijane. Plan importera nie sprawdza
nakładania ani aktualizacji już powiązanych terminów/statusów. Nie wykonano
zapisu; żadna prawdziwa wizyta nie została utworzona i Booksy pozostaje aktywne.

## Change

- `scripts/reconcile-booksy.ts`: parser CSV, liczbowy raport bez PII,
  pojedynczy snapshot REPEATABLE READ READ ONLY i ROLLBACK, timeout zapytań,
  blokada flag zapisu/resetu, ogólny błąd bez surowego SQL/danych. Obsługuje
  plik albo stdin (`BOOKSY_APPOINTMENTS_CSV=-`). Nie ma ścieżki apply.
- Raport wykrywa ID duplicates, nieznane statusy, niepoprawne daty,
  brakujące linki, rozbieżności czasu/statusu/klientki/pracownika, kolizje
  z celem i pary nakładania w źródle. Nie zgaduje pracownika ani klientki.
  `sourceFreshness=UNVERIFIED`, `readyForImport=false` zawsze — GO jest decyzją ownera.
- UAT przeniesiono na odrębny dev; aktualny PROJECT_STATE zastąpił nieaktualne
  opisy produkcji, legacy i liczby „91 przyszłych”.

## Validation

- Backend przed opcjonalną integracją: 64 suites, 506 tests PASS.
- Nowy plik: 19/19 z włączonym testem PostgreSQL, w tym rzeczywiste CSV →
  oryginalny importer plan/apply/reapply → source links → reconciliation.
  Plan: 0 wizyt, apply: 1, reapply: nadal 1; brak zmian zgód; source cancelled
  wykazane jako drift. Tylko jednorazowa lokalna baza z syntetycznymi fixture.
- Typecheck i build PASS. ESLint nowego skryptu PASS; testy są wyłączone z
  typed lint przez istniejący tsconfig, tak jak pozostałe pliki spec.
- Dodatkowa regresja PostgreSQL kalendarza/przypomnień: 12/12 PASS.

Odtworzenie testu integracyjnego: utwórz jednorazową lokalną bazę PostgreSQL
`booksy_synthetic`, wykonaj build backendu, ustaw BOOKSY_TEST_DATABASE_URL
wskazujący wyłącznie localhost/127.0.0.1 i tę bazę, uruchom
`pnpm exec jest --runInBand src/import/reconcile-booksy.spec.ts` z backendu.
**Test przebudowuje public schema tej bazy. Nigdy nie podawaj bazy dev/prod.**

Uruchomienie raportu na hoście danych po buildzie, z istniejącą prywatną
konfiguracją połączenia: `TZ=Europe/Warsaw BOOKSY_APPOINTMENTS_CSV=<plik>
node dist/scripts/reconcile-booksy.js`. Stdin pozwala uniknąć utrwalania kopii CSV.
Wynik raportu nie jest zgodą na odpalenie IMPORT_BOOKSY_APPLY.

## Rollout

- #1519 frontends na staging: run `40307194830` success; produkcja bez zmian.
- #1521: kod `2b6b25d9`, CI `40308389563` success; staging API
  `40308843842` success. Live health 200 i release dokładnie `2b6b25d9`.
  Wdrożony raport na syntetycznym CSV: missing=1, ambiguous staff=1,
  readyForImport=false, liczba wizyt przed/po 0/0. Wysyłki dev wyłączone.
- #1519: przeglądarka desktop 1440 i mobile 390: 404 → dev `/booking` →
  login z redirectTo=/booking, 0 page errors i brak overflow. Aktualny bundle
  wskazany przez build-manifest nie zawiera martwego Booksy checkboxu.
  Nie jest to zaliczony biznesowy UAT po zalogowaniu.
- Ponowny odczyt konfiguracji dev: własna baza i signing keys względem prod,
  APP_ENV=development, outbound disabled, 0 wizyt. Żadnych danych prod w dev.
- Opisy #1519/#1520 uzupełniono o rzeczywiste wyniki; oba pozostają OPEN.
  Tymczasowy katalog z danymi/raportem na hoście prod usunięty, lokalna baza
  PostgreSQL testu zatrzymana i usunięta. Screenshots dev zachowano wyłącznie
  w lokalnym folderze tej rozmowy, bez danych klientek.
- Ten follow-up zmienia tylko dokumentację dowodów. Runtime staging API ma
  kod `2b6b25d9`, frontendy `41cfd131`; produkcja nadal `328d362f`.
  Dokumentacyjny commit nie wymaga ponownego restartu aplikacji.
- Nie uruchamiano produkcyjnej regresji zapisującej testowe wizyty.
  Historyczna regresja `40291708798`: 23/23 success, to odrębny dowód.

## Follow-up / decyzje

1. Świeży kompletny eksport Booksy w prywatnym miejscu i uzgodniony cutoff;
   ponowić raport i plan z niezależnym zakazem zapisu w PostgreSQL.
2. Właścicielka rozstrzyga anonimowe wizyty, przeszłe confirmed i nakładanie.
   Nie tworzymy sztucznych klientek i nie łączymy wizyt po podobieństwie danych.
3. UAT syntetyczny na dev + osobne potwierdzenie rzeczywistego dostarczenia
   powiadomienia do zaakceptowanego odbiorcy; wyłączone dostawcy dev nie są
   dowodem dostarczenia.
4. Dopiero udokumentowane GO + zgoda ownera: finalny backup, zaakceptowany plan,
   import, powtórny plan idempotencji i kontrola kalendarza; osobna zgoda na
   wyłączenie Booksy. Bez tej decyzji nie ma produkcyjnego merge ani importu.
5. #1520 ma zachować dowód już wykonanej operacji; nie kasować nic ponownie.
