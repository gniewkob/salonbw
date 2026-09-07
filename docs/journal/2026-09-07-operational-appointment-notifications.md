# Powiadomienia o wizytach niezależne od marketingu

- **Data:** 2026-09-07
- **Agent:** Codex
- **Commit(y):** ten changeset; SHA i rollout do uzupełnienia po wdrożeniu
- **PR:** brak; master

## Finding

Potwierdzenia, przełożenia i przypomnienia używały pól zgód marketingowych
jako preferencji dostarczenia wiadomości o konkretnej wizycie. Awaria WhatsApp
nie uruchamiała fallbacku e-mailowego, anulowanie nie informowało klientki,
a ukryty `receiveNotifications` mógł blokować kanały zaznaczone w panelu.
Formatowanie części wiadomości używało UTC lub strefy procesu zamiast czasu
salonu.

Testy fail-first dały 6 błędów: brak nowych domyślnych preferencji, brak
operacyjnego e-maila przypomnienia, brak niezależnego WhatsApp, brak fallbacku,
brak e-maila anulowania i brak dwóch osobnych sekcji w panelu.

Nie odczytywano ani nie modyfikowano danych produkcyjnych.

## Change

- Dodano operacyjne `notifyEmail`, `notifyWhatsapp` i `notifySms`, pozostawiając
  zgody marketingowe jako osobne pola. `receiveNotifications` jest widocznym
  przełącznikiem głównym.
- Migracja zachowuje dotychczasowe zachowanie istniejących kont przez backfill
  z poprzednich ustawień. Nowe konta mają e-mail operacyjny włączony, a SMS,
  WhatsApp i marketing wyłączone.
- Potwierdzenie i przełożenie próbują WhatsApp, a po jego wyłączeniu, braku lub
  błędzie korzystają z operacyjnego e-maila. Anulowanie wysyła e-mail.
- Przypomnienia czytają preferencje operacyjne. Wszystkie terminy w tych
  kanałach są formatowane w `Europe/Warsaw`.
- Konto klientki ma osobne sekcje „Powiadomienia o wizytach” i „Zgody
  marketingowe”, wraz z informacją zwrotną przy właściwym zapisie.
- Audyt strony konta ujawnił i usunął trzy regresje dostępności: fokus w
  ukrytym menu mobilnym, kontrast przycisku zdjęcia i nazwę awatara.

## Validation

- Rytuał fail-first: 6 testów FAIL przed implementacją, PASS po zmianie.
- Backend: 44 zestawy / 360 testów PASS; typecheck i build PASS.
- Panel: 95 zestawów / 378 testów PASS; ESLint, typecheck i build PASS.
- Backend ESLint: 0 błędów, 153 istniejące ostrzeżenia; niezwiązane zmiany
  formatowania wycofano.
- Izolowany PostgreSQL 16: 3/3 PASS — dwie kontrole współbieżności oraz realny
  cykl migracji `down → dane starego modelu → up`, backfill i nowe defaulty.
- Playwright: strona konta sprawdzona na 1440 px i 390 px bez przepełnień;
  zrzuty w lokalnym, ignorowanym `output/playwright/`.
- Lighthouse accessibility na lokalnym buildzie i syntetycznym profilu:
  100/100. `git diff --check`: PASS.

## Rollout

Do uzupełnienia po pushu i zakończeniu CI/Deploy.

Rollback: preferowany jest forward fix. Wycofanie aplikacji jest odwracalne,
ale `down` migracji usuwa zapisane preferencje operacyjne i wymaga kopii danych.

## Follow-up

Wdrożyć samodzielne odzyskiwanie hasła klientki. Następnie dodać trwałe
ponowienia niedostarczonych wiadomości i reset przypomnienia po przełożeniu.
