# E4.2 — blokada guardu FK przed syntetycznym resetem

- **Data:** 2026-07-29
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** brak

## Finding

Po czystym planie utworzono świeży dump PostgreSQL w formacie custom. Lokalny
klient `pg_dump` nie był zainstalowany, więc dump wykonano PostgreSQL 16 na
MyDevil, pobrano do katalogu `700`, ustawiono plik `600` i potwierdzono
identyczną checksumę. Zdalną kopię tymczasową usunięto.

`synthetic:data:apply` zatrzymało się przed `startTransaction()` komunikatem
`Unexpected foreign key: inventory_movements -> users`. Ponowiony plan miał
identyczne liczności, co potwierdziło brak mutacji.

Inspekcja schematu wykazała, że relacja dotyczy opcjonalnego `actorId`, ma
`ON DELETE SET NULL`, a sama tabela jest kasowana przed niechronionymi
klientami. Relacja mieści się więc w istniejącej granicy resetu; brakowało
jednego fingerprintu na allowliście.

Po wdrożeniu poprawki i nowym potwierdzeniu ownera utworzono kolejny świeży
dump, zweryfikowano checksumę i ponowiono `apply` dokładnie raz. Guard ponownie
zatrzymał operację przed transakcją, tym razem na
`product_sales -> appointments`. Następujący po błędzie read-only plan zachował
identyczne liczności i 0 blockerów, więc również ta próba nie zmieniła bazy.

Pełny read-only diff wszystkich produkcyjnych FK wskazujących na `users`,
`appointments` lub `products` objął 59 unikalnych fingerprintów. Jedynymi
trzema brakami były `product_sales → appointments`, `product_sales → products`
i `product_sales → users`. Produkcja ma 2 rekordy `product_sales`; oba wskazują
na ten sam produkt, żaden nie wskazuje na wizytę ani pracownika. Relacja do
produktu ma `ON DELETE RESTRICT`, więc samo rozszerzenie allowlisty bez
skasowania `product_sales` nadal blokowałoby reset produktów.

Trzecie `apply`, wykonane po nowym dumpie i zgodzie ownera, przeszło kontrolę
fingerprintów, ale zostało wycofane przez PostgreSQL na relacji
`logs.userId → users.id` z regułą `NO ACTION`. Plan bezpośrednio po rollbacku
ponownie miał te same liczności i 0 blockerów. Audyt semantyczny 76 relacji
wykazał:

- `commission_rules.employeeId → users.id`: 0 odwołań do klientów objętych
  resetem;
- `logs.userId → users.id`: 188 odwołań do klientów objętych resetem.

Tabela `logs` zawierała 72 285 rekordów. Owner zaakceptował usunięcie tylko
188 rekordów powiązanych z usuwanymi klientami i zachowanie całej pozostałej
historii.

## Change

Pierwsza poprawka dodała `inventory_movements->users` do jawnej allowlisty.
Pełna poprawka:

- dodaje `product_sales` do jawnej grupy danych magazynowych kasowanej przed
  `products`;
- dopuszcza trzy audytowane relacje `product_sales`;
- zbiera wszystkie nieznane FK i raportuje je w jednym deterministycznym
  błędzie, nadal fail-closed.

Kolejna poprawka:

- usuwa z `logs` wyłącznie rekordy powiązane z klientami wybranymi przez ten
  sam warunek co reset `users`, z wyłączeniem chronionych kont;
- identyfikuje reguły `NO ACTION/RESTRICT` wraz z kolumnami;
- dla zachowanych tabel sprawdza przed transakcją, czy istnieją rekordy
  wskazujące na dane przeznaczone do usunięcia;
- traktuje selektywne czyszczenie logów jako jawny, kolumnowy kontrakt zamiast
  dodawać całą tabelę `logs` do resetu.

## Validation

- Fail-first: nowy test odtworzył produkcyjny komunikat o nieoczekiwanym FK.
- Po poprawce: `synthetic-data.store.spec.ts` — 10/10 testów zielonych.
- Pełny backend: 40/40 suite, 284/284 testy; typecheck i build — exit 0.
- ESLint pliku produkcyjnego — exit 0. Repozytoryjna konfiguracja wyklucza
  specy z lint project-service; spec przeszedł przez Jest.
- Produkcyjny FK: `actorId → users`, `ON DELETE SET NULL`; 7 rekordów ruchów,
  w tym 5 z aktorem.
- Ponowiony read-only plan: 0 blockerów; 5 klientów, 19 wizyt, 822 produkty
  i 12 dokumentów nadal przeznaczone do usunięcia.
- Fail-first pełnej poprawki: 3 testy odtworzyły brak tabeli w rejestrze,
  zatrzymanie na pierwszym FK i odrzucenie relacji `product_sales`.
- Po poprawce: `synthetic-data.store.spec.ts` — 11/11 testów.
- Pełny backend: 40/40 suite, 285/285 testów; typecheck i build — exit 0.
- Obowiązkowy `lint --fix`: 0 błędów, 176 istniejących ostrzeżeń; 68
  mechanicznych zmian poza zakresem wycofano, zachowując tylko pliki E4.2.
- Produkcyjny diff po poprawce: 59 fingerprintów, 0 nieoczekiwanych.
- Rzeczywiste `assertResetSchema` uruchomione read-only przeciw produkcji:
  zaakceptowane.
- Fail-first semantycznej poprawki: 4 oczekiwane porażki — brak selektywnego
  kasowania logów, brak wykrycia blokującego FK, brak zapytania przy zerowej
  liczności i brak przekazania chronionych ID.
- Po poprawce: celowane testy store/service 19/19; pełny backend 40/40 suite,
  287/287 testów; typecheck i build — exit 0.
- Obowiązkowy lint: 0 błędów, 176 istniejących ostrzeżeń; mechaniczne zmiany
  poza zakresem zostały wycofane.

## Rollout

Master `58354294`; CI `30430237140` oraz Deploy `30430237091` zakończone
sukcesem. Pełną poprawkę wdrożono na master `eaa01af8`; CI `30437303085`
i Deploy API `30437302302` zakończyły się sukcesem. Po deployu `/healthz`
zwrócił `status=ok`, `database=ok`, a `assertResetSchema` uruchomione
bezpośrednio z wdrożonego artefaktu zaakceptowało produkcyjny schemat.

Semantyczną poprawkę wdrożono na master `855f24d8`; CI `30441429572`
i Deploy `30441429562` zakończyły się sukcesem. Wdrożony preflight uruchomiony
read-only z dwoma chronionymi ID zaakceptował produkcyjny schemat i dane.
`/healthz` zwrócił `status=ok`, `database=ok`. Stary lokalny dump z nieudanej
próby został usunięty, aby nie mógł zostać ponownie użyty.

## Follow-up

Uzyskać nowe potwierdzenie ownera, utworzyć świeży dump i wykonać pojedyncze
`apply`, `verify`, health-check oraz regresję CI.
