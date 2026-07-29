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

## Change

Dodano wyłącznie `inventory_movements->users` do jawnej allowlisty guardu.
Wszystkie inne nieznane FK nadal powodują fail-closed.

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

## Rollout

Master `58354294`; CI `30430237140` oraz Deploy `30430237091` zakończone
sukcesem. Detekcja zmian wdrożyła wyłącznie API.

## Follow-up

Wykonać pełny diff wszystkich produkcyjnych FK względem granicy resetu, zamiast
dodawać kolejne fingerprinty pojedynczo. Po testach i zielonym deployu uzyskać
nowe potwierdzenie ownera. Jeśli dump przekroczy 30 minut, utworzyć nowy;
następnie wykonać pojedyncze `apply`, `verify`, health-check i regresję CI.
