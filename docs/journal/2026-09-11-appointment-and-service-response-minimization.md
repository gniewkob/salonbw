# Minimalizacja odpowiedzi wizyt i katalogu usług

- **Data:** 2026-09-11
- **Agent:** Codex
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

Rola Client mogła wywołać `GET /appointments` i otrzymać pełne encje wizyt,
łącznie z polami wewnętrznymi. Odpowiedzi mutacji również zwracały surowe
encje. Publiczny i kliencki katalog usług zawierał `commissionPercent`, a
część tras udostępniała `privateDescription` i techniczne relacje encji.
Testy fail-first kontrolerów odtworzyły wszystkie trzy przecieki.

## Change

- `GET /appointments` jest dostępny wyłącznie dla personelu; pracownik nadal
  otrzymuje wyłącznie własny kalendarz.
- Odczyty i mutacje wizyt mapują odpowiedzi przez jawne DTO klienta albo
  personelu. Utworzenie wizyty zwraca tylko identyfikator.
- Publiczny, kliencki i pracowniczy katalog usług nie zawiera prywatnego opisu,
  prowizji, dat technicznych ani relacji niezwiązanych z rezerwacją.
- Administrator otrzymuje osobny, jawny DTO z polami potrzebnymi do edycji.
- OpenAPI i wygenerowany klient TypeScript opisują oba warianty odpowiedzi.

## Validation

- Fail-first: 5 nowych testów kontrolerów nie przechodziło przed mapowaniem i
  ograniczeniem roli; po zmianie 23/23 testów celowanych PASS.
- Backend: 51 zestawów / 407 testów PASS; typecheck i build PASS.
- Panel: 96 zestawów / 391 testów PASS; typecheck i wcześniejszy pełny build
  Next.js (115 tras) PASS.
- Biblioteka `@salonbw/api`: generator i build PASS.
- Celowany ESLint kodu produkcyjnego: 0 błędów.
- Walidacja OpenAPI potwierdziła bezpieczny DTO tras publicznych, unię DTO
  katalogu zależną od roli i poprawne typy pól nullable.
- Historyczne testy e2e SQLite nie uruchomiły aplikacji: lokalny moduł natywny
  `sqlite3` nie został załadowany, a testowy `EmailsModule` nie ma providera
  `PinoLogger`. To istniejący problem harnessu; zaktualizowane oczekiwania HTTP
  pozostają w zestawie, ale nie są zaliczone jako wykonane.

## Rollout

Commit `b7d3e40e`; CI `34537339158` i Deploy `34537339266` zakończone
`success`. Produkcyjny health potwierdził database, SMTP i Instagram `ok`.
`GET /appointments` i `GET /services` bez sesji zwracają 401. Publiczny katalog
zwrócił 60 pozycji i w żadnej nie było pól prywatnego opisu, prowizji, dat
technicznych ani wewnętrznych relacji. Nie użyto kont ani danych klientek.

## Follow-up

F2: odtworzyć na PostgreSQL równoczesną finalizację i zapewnić dokładnie jeden
komplet skutków magazynowych, receptury i prowizji.
