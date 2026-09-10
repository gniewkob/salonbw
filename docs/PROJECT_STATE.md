# Stan projektu SalonBW

**Aktualizacja: 2026-09-10 · Codex**
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

- Domknięto techniczną ścieżkę pracownika dla kalendarza i przygotowania
  wizyty. API wymusza własny identyfikator pracownika, więc filtr przeglądarki
  nie ujawnia wizyt innych osób. Ta sama kontrola chroni bloki czasu, konflikty,
  przełożenie, notatki, rozmowę i propozycje zużycia. Bezpośredni link do wizyty
  działa również poza aktualnie otwartym dniem i odmawia dostępu do cudzej
  wizyty. Backend 402/402, typecheck/build PASS; produkcyjny panel z
  syntetycznymi odpowiedziami przeszedł widok 1366 i 390 px, wejście z
  kalendarza i linku, konsola 0 błędów.
  Commit `6333c2ae`: CI `34385687700` i Deploy `34385687786` success; health
  oraz uruchomione reguły autoryzacji potwierdzone 2026-09-10. Zakres GO nadal
  obejmuje właścicielkę jako admina, nie osobne konto pracownika.
  [Journal 2026-09-09](journal/2026-09-09-employee-calendar-preparation-path.md).
- Dodano widoczną przed potwierdzeniem wizyty kartę przygotowania: pięć
  ostatnich zakończonych zabiegów łączy usługę, datę, czas w kalendarzu,
  recepturę z proporcjami i wszystkie zużyte materiały po numerze wizyty.
  Osobne zapisy farby i oksydantu nie nadpisują się. Panel 391/391, backend
  385/385, typecheck/build PASS; Chrome 1366 i 390 px oraz Lighthouse
  accessibility 100/100 na danych syntetycznych. Commit `3dd5cb6f`: CI
  `34361230619` i Deploy `34361230613` success; karta potwierdzona również
  w produkcyjnym panelu na 390 px z przechwyconymi danymi syntetycznymi.
  [Journal 2026-09-09](journal/2026-09-09-visit-preparation-history.md).
- Dodano jeden syntetyczny przebieg całego życia wizyty na prawdziwym
  PostgreSQL: rezerwacja online, akceptacja, rozmowa, przełożenie i akceptacja
  nowego terminu, finalizacja z usługą dodatkową, produktem, materiałem,
  recepturą, zaleceniami i prowizjami oraz osobna gałąź anulowania. Test
  fail-first wykrył konflikt prowizji usługowej z produktową i brak powiązania
  zużycia z klientką; oba błędy naprawiono. Historia rozpoznaje też starsze
  zużycia przez numer wizyty bez migracji danych. PostgreSQL 7/7, backend
  385/385, typecheck i build PASS. Commit `13cc8388`: CI `34333128137` i
  Deploy `34333128066` success; poprawiona logika i health potwierdzone na API.
  [Journal 2026-09-09](journal/2026-09-09-synthetic-appointment-lifecycle.md).
- CI wykryło nowe alerty zależności: początkowo 2 critical i 7 high, a po
  odświeżeniu rejestru również nowsze alerty przechodnie. Podniesiono Next.js,
  Sharp, Nodemailer i Multer oraz wymuszono załatane wersje w pnpm i w
  manifestach npm używanych na MyDevil. Lokalnie: 0 high/critical; panel
  390/390, backend 385/385, PostgreSQL 8/8, lint/typecheck/buildy PASS. Czysta
  instalacja produkcyjna npm: frontend 0 podatności, backend tylko 5 low.
  Commit `fa82015c`: CI `34330204469` i Deploy `34330204518` success; wersje
  runtime oraz health potwierdzone na produkcji.
  [Journal 2026-09-09](journal/2026-09-09-new-dependency-advisories.md).
- Dodano powiadomienia rozmów z dokładnym przejściem do wizyty po obu stronach.
  Klientka trafia do właściwego `/visits?visitId=...`, właścicielka do
  `/calendar?appointmentId=...`, a dzwonek pracownika sumuje oczekujące
  rezerwacje i rozmowy, w których klientka napisała ostatnia. Opis nie zawiera
  treści wiadomości. Lokalnie: PostgreSQL 8/8, backend 385/385, panel 390/390,
  typecheck/build PASS; przeglądarka potwierdziła desktop i 390 px, dokładny
  link oraz konsolę bez błędów. Commit `d1438170`: Deploy `34327643747`
  success; CI `34327643732` failure wyłącznie przez nowe alerty zależności,
  następnie commit `fa82015c`: CI `34330204469` i Deploy `34330204518` success.
  Produkcyjne API zawiera nowy licznik i typ powiadomienia; endpoint bez sesji
  zwraca 401.
  [Journal 2026-09-09](journal/2026-09-09-message-action-notifications.md).
- Otwarty wątek wiadomości przy wizycie odświeża się teraz co 15 sekund bez
  przeładowania. Spóźniona odpowiedź poprzedniej wizyty nie może nadpisać
  aktualnej rozmowy ani wyczyścić nowego szkicu. Lokalnie: komponent 16/16,
  pełny panel 387/387, lint, typecheck i build PASS. Prawdziwa przeglądarka na
  danych syntetycznych potwierdziła napływ odpowiedzi, desktop i 390 px oraz
  konsolę bez błędów. Commit `76060b82`: CI `34206361010` i Deploy
  `34206361081` success; produkcyjny bundle `/visits` ma interwał 15 sekund i
  pomija ukrytą kartę, bez logowania do kont klientek.
  [Journal 2026-09-08](journal/2026-09-08-live-appointment-message-thread.md).
- Dodano trwałe ponowienia przypomnień: zaległe próby wracają w kolejnych
  przebiegach, a wspólna atomowa blokada zapobiega dublowaniu między automatem
  godzinowym i ręcznymi regułami. Status `failed` z SMS nie jest już sukcesem,
  a awaria kanałów jest widoczna jako błąd. Obie ścieżki przełożenia zerują
  stan przypomnienia dla nowego terminu. Lokalnie: PostgreSQL 5/5, backend
  382/382, testy celowane 55/55, typecheck i build PASS. Commit `e8bfda79`:
  CI `34203689053` i Deploy `34203689078` success; health oraz atomowy licznik
  prób potwierdzone w kodzie wykonywanym na API bez uruchamiania wysyłki.
  [Journal 2026-09-08](journal/2026-09-08-durable-reminder-retries.md).
- Dodano bezpieczne, samodzielne odzyskiwanie hasła: neutralna odpowiedź,
  jednorazowy token przechowywany tylko jako skrót, ważność 30 minut i
  unieważnienie wszystkich sesji po zmianie hasła. Panel ma polskie strony,
  link z logowania i usuwa token z adresu po jego przejęciu. Lokalnie: backend
  373/373, panel 383/383, PostgreSQL 2/2, lint/typecheck/build PASS, Chrome bez
  błędów i Lighthouse accessibility 100/100. Commit `279d9093`: CI
  `34163811986` i Deploy `34163811945` success; produkcyjne API, trzy strony
  panelu, neutralna odpowiedź i odrzucenie fałszywego tokenu zweryfikowane.
  [Journal 2026-09-07](journal/2026-09-07-self-service-password-recovery.md).
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

**Bezpieczeństwo:** lokalny audyt 2026-09-09 po remediacji nowych alertów:
0 high/critical, 6 moderate i 2 low. Bramka CI nadal blokuje high/critical.
Pozostaje przegląd umiarkowanych i niskich podatności.

Nie ma obecnie otwartego lokalnie odtworzonego błędu P1 z audytu procesu.
Automatyczny dowód spójności pełnego cyklu jest gotowy; pozostaje rzeczywisty
UAT właścicielki i dostarczenie powiadomień na jej urządzenie.

**Następny krok:** przygotować i przejść krótki realny UAT właścicielki na
jednym oznaczonym zestawie danych. Zacząć od otwarcia oczekującej koloryzacji
i oceny historii przygotowania, następnie: telefon klientki → powiadomienie
salonu → rozmowa → przełożenie → finalizacja z kontrolą magazynu i rozliczenia
przed/po.

## Fakty zweryfikowane

- 2026-09-10 po wdrożeniu `6333c2ae`: CI `34385687700` i Deploy
  `34385687786` success. API health: database, smtp i instagram `ok`; odczyt
  wizyty i kalendarza bez sesji zwraca 401. W wykonywanym artefakcie API są
  reguły własnego kalendarza, własnej wizyty oraz identyfikatora pracownika z
  sesji. Nie użyto kont ani danych klientek i nie wykonano zapisu.
- 2026-09-09 lokalnie: pracownik nie może rozszerzyć wyniku kalendarza przez
  własny filtr ani odczytać wizyty innego pracownika. Własną wizytę otwiera z
  kalendarza oraz z bezpośredniego linku poza aktualnym dniem. Backend 402/402,
  typecheck/build PASS; Chrome 1366 i 390 px na produkcyjnym panelu z
  przechwyconymi danymi syntetycznymi, konsola 0 błędów. Rzeczywiste konto
  pracownika pozostaje poza obecnym zakresem GO i nie było używane.
- 2026-09-09 po wdrożeniu `3dd5cb6f`: CI `34361230619` i Deploy
  `34361230613` success. API health: database, smtp i instagram `ok`;
  wykonywane artefakty panelu i API zawierają kartę przygotowania oraz
  `durationMinutes`. Produkcyjny panel na 390 px pokazał pełną syntetyczną
  recepturę i dwa osobne materiały, konsola 0 błędów. Odpowiedzi API były
  przechwycone; nie użyto kont ani danych klientek i nie wykonano zapisu.
- 2026-09-09 lokalnie: oczekująca rezerwacja online pokazuje pięć ostatnich
  zakończonych zabiegów wraz z czasem w kalendarzu, recepturą, proporcjami i
  wszystkimi wpisami zużycia przypisanymi do wizyty. Panel 391/391, backend
  385/385, typecheck i build obu aplikacji PASS. Chrome 1366 i 390 px bez
  przepełnienia; Lighthouse accessibility 100/100. Użyto wyłącznie danych
  syntetycznych. Rzeczywisty czas zabiegu nie jest obecnie mierzony.
- 2026-09-09 po wdrożeniu `13cc8388`: CI `34333128137` i Deploy
  `34333128066` success. Produkcyjne API health: database, smtp i instagram
  `ok`; wykonywany artefakt zawiera rozdzielenie prowizji produktu, `clientId`
  zużycia z wizyty i odczyt starszej historii przez `appointmentId`. Nie
  wywołano zapisu ani nie użyto kont klientek.
- 2026-09-09 lokalnie: spójny cykl syntetycznej wizyty na PostgreSQL przeszedł
  1/1, cała bramka PostgreSQL 7/7, backend 385/385. Potwierdzono osobne
  prowizje usługi i produktu, spadek dwóch stanów magazynowych, sprzedaż,
  recepturę, zalecenia, historię materiałów także dla starszego zapisu,
  prywatność kwot/notatki oraz anulowanie drugiej rezerwacji. Nie użyto danych
  ani kanałów produkcyjnych.
- 2026-09-09 po wdrożeniu `fa82015c`: CI `34330204469` i Deploy
  `34330204518` success. API health: database, smtp, instagram `ok`; panel
  logowania i landing HTTP 200. Produkcja: Next.js 15.5.24, Sharp 0.35.4,
  PostCSS 8.5.24, Multer 2.3.0 i Nodemailer 9.1.1. Artefakt API zawiera
  `actionable-count` i `appointment_message_action`; brak sesji daje 401.
- 2026-09-09 lokalnie: `pnpm audit` 0 high/critical, 6 moderate, 2 low.
  Czyste drzewa npm odwzorowujące MyDevil: frontend 0 podatności; backend
  0 high/critical i 5 low. Next.js 15.5.24, Sharp 0.35.4, Multer 2.3.0,
  Nodemailer 9.1.1, PostCSS 8.5.24, `js-yaml` 5.2.2 i `tar` 7.5.21.
- 2026-09-09 lokalnie: zapytania PostgreSQL wybierają właściwą ostatnią stronę
  rozmowy także przy równych czasach; klientka i właścicielka dostają dokładny
  link bez treści wiadomości. Backend 385/385, panel 390/390 PASS. Syntetyczny
  widok admina pokazał licznik na komputerze i 390 px bez błędów konsoli.
- 2026-09-08 po wdrożeniu `76060b82`: panel login HTTP 200, chronione `/visits`
  HTTP 307 bez sesji. Produkcyjny bundle `/visits` zawiera odświeżanie co
  15 sekund tylko dla widocznej karty. CI `34206361010` i Deploy `34206361081`
  success; nie wywoływano endpointu wiadomości.
- 2026-09-08 lokalnie: otwarty wątek klientki pobrał syntetyczną odpowiedź
  salonu po 15 sekundach bez przeładowania. Widoki desktop i 390 px były
  czytelne, konsola bez błędów. Panel: 96 zestawów / 387 testów PASS.
- 2026-09-08 po wdrożeniu `e8bfda79`: API `/healthz` HTTP 200; database, smtp
  i instagram `ok`. W wykonywanym artefakcie API jest atomowe zwiększanie
  `reminderAttemptCount`. CI `34203689053` i Deploy `34203689078` success.
  Nie uruchomiono wysyłki ani nie odczytano danych klientek.
- 2026-09-08 lokalnie: dwa równoległe procesy przypomnienia na PostgreSQL
  wysłały dokładnie jedną wiadomość i zapisały jedną próbę; migracja `down/up`
  oraz dotychczasowe testy współbieżności przeszły 5/5.
- 2026-09-07 po wdrożeniu `279d9093`: API `/healthz` HTTP 200; database, smtp
  i instagram `ok`. Login, prośba o reset i ustawienie hasła HTTP 200.
  Syntetyczny nieistniejący adres otrzymał neutralne 202, fałszywy token 400.
  Produkcyjny panel na 390 px usuwa token z adresu i działa bez błędów konsoli;
  żądanie formularza przechwycono, więc nie zmieniono danych ani nie wysłano
  wiadomości.
- 2026-09-07 lokalnie: pełny backend 373/373 i panel 383/383 PASS; migracja i
  współbieżne użycie tokenu na PostgreSQL 2/2 PASS. Produkcyjny build panelu
  usuwa token z adresu, wysyła właściwy syntetyczny token, nie ma błędów
  konsoli ani przepełnienia na 390 px; Lighthouse accessibility 100/100.
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
- Owner zaakceptował 2026-09-07 e-mailowy reset hasła z 30-minutowym tokenem.
  Test rzeczywistego dostarczenia wymaga wskazanego odbiorcy; nie wysyłano
  wiadomości do realnych klientek.
- Restore-drill pominięty decyzją ownera 2026-08-06; nie uznawać tego za dowód
  odtwarzalności backupu. Przed realnymi danymi ponownie ocenić ten warunek.
- SMS/WhatsApp były nieskonfigurowane 2026-08-07; dziś nie sprawdzano sekretów.
  Push wdrożony wcześniej, ale odbiór na telefonie wymaga testu.
- Historyczny cleanup/dataset z 2026-08-06 nie jest dowodem aktualnej czystości
  bazy. Nie czytano i nie modyfikowano dziś danych klientów.
- Pozostałe decyzje: przegląd prawny, dane firmy, kategorie produktów,
  trwałość uploads — szczegóły i historyczne decyzje w planie/journalach.
