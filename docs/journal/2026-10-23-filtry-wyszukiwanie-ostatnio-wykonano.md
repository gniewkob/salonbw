# Filtry zgód, wyszukiwanie po e-mailu i „ostatnio wykonano” per usługa

- **Data:** 2026-10-23
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit
- **PR:** branch `claude/customer-filters-email-search-last-done`

## Finding

Przegląd panelu w przeglądarce po imporcie Booksy (1068 klientek, karta
id 520 z 308 wizytami). Wydajność jest dobra (API 33–192 ms), ale są trzy błędy:

1. **Filtry „Brak zgody email” i „Brak zgody SMS” zawsze dają 0.** Wszystkie
   1068 klientek ma obie zgody `false` (sprawdzone w bazie), a lista zwraca
   0. `CustomerFilterDto` używał `@Type(() => Boolean)`, więc tekst `"false"`
   z query stringa zamieniał się w `true` (`Boolean("false") === true`).
   Dotyczy to wszystkich 5 filtrów logicznych tego DTO.
2. **Wyszukiwarka klientów nie przeszukuje e-maili**, choć pole obiecuje
   „nazwa, telefon lub email”. Fraza „@gmail.com” daje 0 wyników przy 239
   takich adresach w bazie. Zapytanie w `customers.service.ts` sprawdzało tylko
   imię, nazwisko i telefon.
3. **„Ostatnio wykonano” w zakładce Statystyki** pokazuje przy każdej usłudze
   tę samą datę, czyli ostatnią wizytę w ogóle (`stats.lastVisitDate`). Na
   karcie 520 było 22.10 przy 5 usługach, a w bazie są daty od 23.04 do 22.10.
   Błąd istniał przed importem; historia z Booksy tylko go uwidoczniła.

## Change

- `CustomerFilterDto`: `@Type(() => Boolean)` zastąpione
  `@Transform(toBooleanQuery)`, które rozpoznaje tylko `true`/`"true"`
  i `false`/`"false"`. Każdą inną wartość odrzuca `@IsBoolean`.
- `CustomersService.findAll`: wyszukiwanie obejmuje też `user.email`.
- `CustomerStatisticsService`: każdy wpis `favoriteServices` ma
  `lastPerformedAt`, czyli najpóźniejszy `startTime` zrealizowanej wizyty
  z tą usługą. Panel (`CustomerStatisticsTab`) pokazuje tę datę przy usłudze.

## Validation

- Testy najpierw: 8 nowych testów backendu i 1 test panelu padły przed
  poprawką z oczekiwanych powodów („false” jako `true`, brak `user.email`
  w zapytaniu, 10.03.2026 przy obu usługach w panelu). Po poprawce przechodzą.
- Backend: `jest` 453/454. Jedyny błąd to
  `calendar.service.spec` („a scheduled Sunday is bookable…”), który pada
  identycznie na czystym masterze (sprawdzone przez `git stash`).
  `tsc --noEmit` czyste, `eslint` 0 błędów (4 ostrzeżenia w niezmienionych
  liniach), prettier czysty.
- Panel: `jest` 405/405, `tsc --noEmit` czyste, `eslint src` czyste.
- `pnpm lint` w backendzie uruchamia `eslint --fix` na całym `src`
  i przeformatował ok. 70 niezwiązanych plików (migracje i inne). Te zmiany
  cofnięto, commit zawiera tylko pliki z tego zadania.

## Rollout

Nie wdrożone. Po scaleniu i deployu (api + panel) sprawdzić na produkcji:
filtr „Brak zgody email” = 1068, wyszukanie po adresie e-mail, różne daty
„ostatnio wykonano” przy usługach na karcie id 520.

## Follow-up

- Test `calendar.service.spec` z niedzielą pada na masterze. Wymaga osobnej
  naprawy.
- Słabości UX z przeglądu czekają na decyzję: brak skoku do wybranej strony
  (pole numeru strony jest tylko do odczytu, a stron jest 54), placeholder
  `booksy.…@import.local.invalid` pokazywany jak prawdziwy adres z linkiem
  `mailto` (591 kart), „Klienci (6)” w górnym pasku bez linku do pełnych
  wyników.
