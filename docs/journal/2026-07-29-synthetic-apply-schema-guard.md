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

## Change

Pierwsza poprawka dodała `inventory_movements->users` do jawnej allowlisty.
Pełna poprawka:

- dodaje `product_sales` do jawnej grupy danych magazynowych kasowanej przed
  `products`;
- dopuszcza trzy audytowane relacje `product_sales`;
- zbiera wszystkie nieznane FK i raportuje je w jednym deterministycznym
  błędzie, nadal fail-closed.

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

## Rollout

Master `58354294`; CI `30430237140` oraz Deploy `30430237091` zakończone
sukcesem. Pełną poprawkę wdrożono na master `eaa01af8`; CI `30437303085`
i Deploy API `30437302302` zakończyły się sukcesem. Po deployu `/healthz`
zwrócił `status=ok`, `database=ok`, a `assertResetSchema` uruchomione
bezpośrednio z wdrożonego artefaktu zaakceptowało produkcyjny schemat.

## Follow-up

Uzyskać nowe potwierdzenie ownera. Utworzyć świeży dump, następnie wykonać
pojedyncze `apply`, `verify`, health-check i regresję CI.
