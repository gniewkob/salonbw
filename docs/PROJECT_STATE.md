# Stan projektu SalonBW

**Aktualizacja: 2026-09-07 · Codex**
Zasady: [HANDOFF_PROTOCOL.md](HANDOFF_PROTOCOL.md).
Historia: [docs/journal](journal/). Plan ogólny: [PROJECT_COMPLETION_PLAN.md](PROJECT_COMPLETION_PLAN.md).

## Cel i zakres

Jeden salon, właścicielka pracuje jako admin; pracownicy poza zakresem GO.
Klientka samodzielnie rezerwuje i uzgadnia wizyty, właścicielka obsługuje dzień
pracy, historię zabiegów i rozliczenie. Priorytet ownera z 2026-09-06:
**pewność, że cały proces działa niezawodnie**.

## Gdzie jesteśmy

Istnieje rozbudowany, działający system. Historyczne UAT z lipca przeszły,
ale obecny przegląd znalazł luki między modułami. **Brak podstaw do uznania
całego procesu za gotowy do szerokiego startu.**
Raport, dowody i kryteria akceptacji:
[journal 2026-09-06](journal/2026-09-06-reliability-audit-and-confirmed-reminders.md).

## Ostatnio zrobione

- Rozdzielono powiadomienia operacyjne od zgód marketingowych. Potwierdzenie
  i przełożenie mają fallback WhatsApp → e-mail, anulowanie wysyła e-mail,
  przypomnienia czytają nowe preferencje, a terminy są formatowane w
  `Europe/Warsaw`. Migracja zachowuje dotychczasowe zachowanie istniejących
  kont; nowe konta domyślnie dostają e-mail operacyjny bez zgody marketingowej.
  Panel pokazuje osobne sekcje i przełącznik główny. Lokalnie: backend 360/360,
  panel 378/378, PostgreSQL 3/3, lint/typecheck/build PASS, Lighthouse
  accessibility 100/100. Commit `5dff55f5`: CI `34138396535` i Deploy
  `34138396546` success; health i widok mobilny produkcji zweryfikowane.
  [Journal 2026-09-07](journal/2026-09-07-operational-appointment-notifications.md).
- Obie ścieżki przełożenia terminu są chronione przed równoczesnym zapisem,
  gdy nakładanie wizyt jest wyłączone. Test PostgreSQL fail-first zapisywał
  wcześniej dwie wizyty; po poprawce daje 1 sukces i 1 konflikt. Jawne `force`
  i włączone nakładanie zachowują zamierzone działanie. Lokalnie: PostgreSQL
  2/2, backend 354/354, typecheck, lint i build PASS. Commit `e8679346`:
  CI `34109975218` i Deploy `34109975329` success; blokada potwierdzona w kodzie
  wykonywanym na API, health ok.
  [Journal 2026-09-07](journal/2026-09-07-concurrent-reschedule-guard.md).
- Finalizacja wizyty jest teraz atomowa z rozliczeniem magazynu: status,
  prowizja, formuła, sprzedaż i zużycie materiałów korzystają z jednej
  transakcji. Dwa testy fail-first wykazały wcześniej pozostawienie wizyty jako
  `completed` po błędzie sprzedaży lub zużycia; po poprawce oba błędy wycofują
  całość. Lokalnie: backend 44 zestawy / 354 testy, PostgreSQL 1/1, typecheck,
  lint i build PASS. Commit `23909986`: CI `34108202419` i Deploy
  `34108201846` success; wspólna transakcja potwierdzona w kodzie wykonywanym
  na API, health ok. [Journal 2026-09-07](journal/2026-09-07-atomic-appointment-finalization.md).
- Usunięto wyścig dwóch równoczesnych rezerwacji online na ten sam termin:
  zapis bez dozwolonego nakładania blokuje harmonogram osoby w transakcji,
  ponownie sprawdza konflikt i dopiero zapisuje. Test na izolowanym PostgreSQL
  reprodukuje 2 zapisy przed poprawką i 1 zapis + 1 konflikt po poprawce.
  Commit `5620f3b8`: CI `34104575891` i Deploy `34104575839` success;
  blokada potwierdzona w kodzie wykonywanym na API, health ok.
  [Journal 2026-09-07](journal/2026-09-07-concurrent-booking-guard.md).
- Za zgodą ownera naprawiono bramkę audytu CI i zaktualizowano 7 bibliotek,
  także w manifestach npm używanych na MyDevil. Audyt: 0 high/critical,
  6 moderate; 786 testów, typecheck, lint i buildy PASS. Commit `58177205`:
  CI `34100103831` i Deploy `34100103827` success; wersje runtime potwierdzone
  na API, panelu i landingu 2026-09-07. Szczegóły:
  [journal 2026-09-07](journal/2026-09-07-security-audit-gate-and-runtime-dependencies.md).
- Wdrożono w `67fcab0a` naprawę pomijania `confirmed` przez główny automat przypomnień:
  cron, ręczne uruchomienie i licznik. Trzy testy FAIL przed / PASS po naprawie.
- Panel: 378/378 testów; backend po poprawce: 354/354. Typecheck obu aplikacji
  i build backendu PASS. Backend lint: 0 błędów, 153 ostrzeżenia.
- CI `34053958164` i Deploy `34053958184`: success; poprawka potwierdzona
  w pliku wykonywanym na API. Health 2026-09-07: database/smtp/instagram ok.
  Dotarcie wiadomości na telefon pozostaje nieweryfikowane.

## Otwarte problemy i następny krok

**Bezpieczeństwo:** lokalny audyt 2026-09-07 po zatwierdzonej naprawie:
0 high/critical i 6 moderate. Usunięto `--ignore-unfixable` z bramki CI.
Pozostaje przegląd umiarkowanych podatności (`dompurify`, `@humanfs/node`, `qs`).

1. **P1 dostęp klientki:** brak samodzielnego odzyskiwania hasła.
2. **P2 ciągłość:** wątki wiadomości bez automatycznego odświeżania; przypomnienia
   bez trwałych ponowień i resetu po przełożeniu już przypomnianej wizyty.

**Następny krok:** zaprojektować i wdrożyć bezpieczne, samodzielne odzyskiwanie
hasła klientki, z jednorazowym tokenem, wygaśnięciem i testem pełnego przepływu.

## Fakty zweryfikowane

- 2026-09-07 po wdrożeniu `5dff55f5`: API `/healthz` HTTP 200; database, smtp
  i instagram `ok`. Panel konta na 390 px pokazuje rozdzielone ustawienia z
  wdrożonego bundle; sprawdzenie używało syntetycznego profilu i nie zapisywało
  danych ani nie wysyłało wiadomości.
- 2026-09-07 po wdrożeniu: API `/healthz` HTTP 200; database, smtp, instagram: ok.
  Panel przekierowuje do logowania (HTTP 200), landing dev HTTP 200.
  To test infrastruktury,
  nie dowód dostarczenia wiadomości ani poprawności procesu biznesowego.
- 2026-09-06: formularze login/register dostępne w przeglądarce.
- 2026-09-06: bazowy SHA `67cb1ede`, lokalny master zgodny z origin/master; poprzednie
  CI i Deploy success (runy z 2026-08-07); 22 otwarte PR-y zależności.

## Zablokowane na ownerze / utrzymane decyzje

- Miękki start i udostępnienie klientkom, import danych oraz przełączenie
  landingu na salon-bw.pl wymagają odrębnych decyzji. Przy cutoverze obowiązuje
  checklista Meta z RELEASE_CHECKLIST.md.
- Rozdzielenie powiadomień obsługowych od marketingu zaakceptowane przez ownera
  2026-09-07. Testy rzeczywistego dostarczenia nadal wymagają wskazanych
  odbiorców; nie wysyłano wiadomości do realnych klientek.
- Zmiana uwierzytelniania dla odzyskiwania konta wymaga uzgodnienia kanału i
  czasu ważności tokenu przed wysyłką prawdziwych wiadomości.
- Restore-drill pominięty decyzją ownera 2026-08-06; nie uznawać tego za dowód
  odtwarzalności backupu. Przed realnymi danymi ponownie ocenić ten warunek.
- SMS/WhatsApp były nieskonfigurowane 2026-08-07; dziś nie sprawdzano sekretów.
  Push wdrożony wcześniej, ale odbiór na telefonie wymaga testu.
- Historyczny cleanup/dataset z 2026-08-06 nie jest dowodem aktualnej czystości
  bazy. Nie czytano i nie modyfikowano dziś danych klientów.
- Pozostałe decyzje: przegląd prawny, dane firmy, kategorie produktów,
  trwałość uploads — szczegóły i historyczne decyzje w planie/journalach.
