# Samodzielne odzyskiwanie hasła

- **Data:** 2026-09-07
- **Agent:** Codex
- **Commit(y):** `279d9093` + dokumentacja wyników
- **PR:** brak; master

## Finding

Panel logowania nie miał ścieżki „Nie pamiętasz hasła?”, a API nie udostępniało
bezpiecznego procesu odzyskania dostępu. Klientka zależała więc od ręcznej
pomocy właścicielki. Nie istniał jednorazowy token, termin ważności ani
unieważnienie aktywnych sesji po zmianie hasła.

Testy fail-first potwierdziły brak usługi resetu, kontroli wersji sesji, stron
panelu i wywołań API. Nie odczytywano ani nie modyfikowano danych produkcyjnych
i nie wysłano prawdziwej wiadomości.

## Change

- Dodano neutralne żądanie resetu dla istniejącego i nieistniejącego adresu,
  z ograniczeniem częstotliwości i minimalnym czasem odpowiedzi.
- Jednorazowy token ma 32 losowe bajty, ważność 30 minut i jest przechowywany
  wyłącznie jako skrót SHA-256. Link przekazuje token w fragmencie adresu;
  panel przejmuje go i usuwa z paska adresu.
- Zmiana hasła działa w transakcji, oznacza token jako użyty, unieważnia inne
  tokeny resetu oraz wszystkie aktywne tokeny odświeżania. Wersja autoryzacji
  natychmiast odrzuca także istniejące tokeny dostępu.
- Dodano polskie, responsywne i dostępne strony prośby o reset oraz ustawienia
  nowego hasła, link z logowania i bezpieczne logowanie zdarzenia bez tokenu.
- Dodano migrację bazy, kontrakt OpenAPI i typy wspólnego klienta API.

## Validation

- Rytuał fail-first: testy backendu i panelu FAIL przed implementacją, PASS po.
- Backend: 47 zestawów / 373 testy PASS; typecheck i build PASS.
- Panel: 96 zestawów / 383 testy PASS; ESLint, typecheck i build PASS.
- Izolowany PostgreSQL 16: 2/2 PASS — realny cykl migracji oraz dwie równoczesne
  próby użycia jednego tokenu dają dokładnie jeden sukces; sesja jest cofnięta.
- Playwright/Chrome: token usunięty z adresu, poprawne dane formularza,
  brak błędów konsoli i przepełnienia poziomego na 390 px.
- Lighthouse accessibility: login, prośba o reset i ustawienie hasła 100/100;
  końcowy build strony resetu ponownie 100/100.
- Wygenerowanie Swaggera blokuje istniejąca niezgodność `@nestjs/swagger` z
  `path-to-regexp`; kontrakt zaktualizowano minimalnie, a generowanie typów PASS.
  Pełny zestaw e2e ma istniejący problem środowiskowy z natywnym SQLite/Pino;
  krytyczna transakcja została sprawdzona na rzeczywistym PostgreSQL.

## Rollout

- Commit `279d9093`: [CI 34163811986](https://github.com/gniewkob/salonbw/actions/runs/34163811986)
  i [Deploy 34163811945](https://github.com/gniewkob/salonbw/actions/runs/34163811945)
  completed/success.
- Health API 2026-09-07 21:44 UTC: HTTP 200; database, smtp i instagram `ok`.
  Login, prośba o reset i ustawienie hasła w panelu: HTTP 200.
- Produkcyjne API dla syntetycznego, nieistniejącego adresu zwróciło neutralne
  HTTP 202. Fałszywy token zwrócił generyczne HTTP 400; nie wykonano zapisu ani
  wysyłki wiadomości.
- Wdrożony panel sprawdzono w Chrome na 390 px z przechwyconym wywołaniem API:
  token znika z adresu, formularz przekazuje właściwą wartość, brak błędów
  konsoli i przepełnienia poziomego.

Rollback: preferowany jest forward fix. Cofnięcie migracji usuwa historię
tokenów resetu i kolumnę wersji autoryzacji, więc wymaga kopii danych.

## Follow-up

Dodać trwałe ponowienia niedostarczonych przypomnień oraz wyzerowanie znacznika
przypomnienia, gdy wcześniej przypomniana wizyta zostanie przełożona.
