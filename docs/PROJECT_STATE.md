# Stan projektu SalonBW

**Aktualizacja: 2026-09-11 · Claude Opus 5**
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

- Odblokowano bramkę PostgreSQL w CI. Po `d2d4ff18` CI `34573029409` padało w
  jobie „Backend API": `beforeAll` obu specyfikacji PostgreSQL dostawał domyślne
  5 000 ms, a robi `dropSchema` razem z pełnym przebiegiem migracji, więc na
  wolniejszym runnerze hook przekraczał limit i zrywał połączenie w trakcie
  migracji. To nie była awaria importu ani migracji. `test/jest-e2e.json` ma
  teraz `testTimeout`, a oba hooki jawny limit. Fail-first odtworzył sygnaturę
  z CI, po poprawce PostgreSQL 14/14, backend 414/414, typecheck, lint i
  Prettier zmienionych plików PASS. Deploy `34573029371` zatrzymał się na
  bramce F6 poprawnie, więc `d2d4ff18` nie trafił na produkcję.
  [Journal 2026-09-11](journal/2026-09-11-pg-spec-hook-timeout.md).

- Zamknięto lokalnie F3/F8 na danych syntetycznych: import domyślnie tworzy
  plan porównany z bazą, a zapis wymaga jawnego `*_APPLY=1` i odbywa się w
  jednej transakcji. Reimport usług zachowuje ID wariantów i FK, a brakujące
  warianty dezaktywuje. Import produktów zachowuje bieżący stan magazynu;
  zastąpienie wymaga osobnej flagi i wartości w jednostce zużycia. Konflikty
  blokują zapis; VAT jest przenoszony jawnie, a wartości przekraczające limity
  kolumn nie są cicho skracane. PostgreSQL 12/12, backend 414/414 i planista
  6/6 PASS. Rzeczywisty plik nadal
  wymaga planu i uzgodnienia bilansu z ownerem.
  [Journal 2026-09-11](journal/2026-09-11-transactional-import-planning.md).
- Zamknięto i wdrożono F5/F7: karta przygotowania odróżnia awarię API od
  rzeczywistego braku historii, zachowuje częściowo pobrane dane i udostępnia
  ponowienie. Aktualizacja usługi unieważnia cache przed odczytem odpowiedzi,
  więc panel nie dostaje starej nazwy ani ceny po zapisie. Testy fail-first
  odtworzyły oba błędy; panel 392/392 i wszystkie bramki PASS. Commit
  `8e57d9c6`: CI `34571875569` i Deploy `34571875597` success. Produkcyjny test
  mobilny 390 px potwierdził błąd bez fałszywego pustego stanu oraz skuteczne
  ponowienie. [Journal 2026-09-11](journal/2026-09-11-history-errors-and-fresh-service-update.md).
- Zamknięto i wdrożono F6: Deploy rozwiązuje ref do niezmiennego SHA i przed
  instalacją/buildem/SSH czeka na `completed/success` CI dokładnie tego commitu.
  Failure, cancellation, brak wyniku przez 30 minut i niepełne SHA blokują
  wydanie. Push `master` używa GitHub environment `production`, zgodnie z
  produkcyjnymi ścieżkami. Testy mock, rzeczywisty zakończony run CI, parser
  YAML, Prettier i kontrola workflow PASS. Commit `86fbbf60`: CI
  `34538833580` i Deploy `34538833612` success; log czasu potwierdził, że praca
  wdrożeniowa ruszyła dopiero po sukcesie CI tego SHA.
  [Journal 2026-09-11](journal/2026-09-11-deploy-after-ci-gate.md).
- Zamknięto F2: finalizacja, proste zakończenie i anulowanie blokują wiersz
  wizyty w transakcji i ponownie sprawdzają status przed zapisem. Test
  fail-first na PostgreSQL odtworzył dwa sukcesy i podwójne rozliczenie; po
  poprawce podwójna finalizacja oraz wyścig anulowanie–finalizacja tworzą jeden
  spójny stan i najwyżej jeden komplet skutków. PostgreSQL 9/9, backend 407/407,
  typecheck, lint i build PASS. Commit `ef81d225`: CI `34538216816` i Deploy
  `34538216861` success; health i blokada w uruchomionym API potwierdzone
  2026-09-11 bez zapisu produkcyjnego.
  [Journal 2026-09-11](journal/2026-09-11-concurrent-terminal-appointment-state.md).
- Zamknięto F1/F4 z review produkcyjnego: klientka nie ma już dostępu do
  zbiorczej listy wizyt, a wszystkie odpowiedzi wizyt i katalogu usług są
  mapowane przez jawne DTO zależne od roli. Publiczny/kliencki katalog nie
  zawiera prywatnego opisu, prowizji ani dat technicznych; admin zachowuje
  pola edycyjne bez surowych relacji encji. Backend 407/407, panel 391/391,
  typecheck/buildy, generator klienta i walidacja OpenAPI PASS. Commit
  `b7d3e40e`: CI `34537339158` i Deploy `34537339266` success; produkcyjny
  health, 401 bez sesji i brak pól prywatnych w publicznym katalogu
  potwierdzone 2026-09-11. Historyczny harness e2e SQLite pozostaje lokalnie
  niesprawny przed startem aplikacji.
  [Journal 2026-09-11](journal/2026-09-11-appointment-and-service-response-minimization.md).
- Review przekrojowe `605fec35` znalazło ponownie otwarte P1: ogólna lista
  wizyt ujawnia klientce pola wewnętrzne, katalog nie minimalizuje wszystkich
  odpowiedzi, finalizacja nie sprawdza statusu pod blokadą, import usuwa
  używane warianty, a Deploy nie czeka na CI. Potwierdzono również stare dane
  w odpowiedzi edycji usługi i mylące stany błędu historii. Testy backend
  402/402, panel 391/391 i typecheck przechodzą mimo tych luk.
  [Review i kolejność poprawek](journal/2026-09-10-cross-system-review-plan.md).
- Ograniczono odpowiedź bezpośredniego odczytu wizyty do jawnego kontraktu
  potrzebnego personelowi. Panel nie otrzymuje już pełnych relacji z adresem
  klientki, kontaktem i podstawą prowizji pracownika ani prywatnymi polami
  usługi i technicznym stanem przypomnień. Naprawiono też generator OpenAPI:
  scoped override zachowuje poprawkę bezpieczeństwa Express i przywraca
  zgodną wersję parsera dla Swaggera. Kontrakt ma 98 tras, 22 wcześniej
  pomijane zostały dopisane, żadnej nie usunięto. Lokalnie: backend 402/402,
  panel 391/391, typecheck, lint, buildy i generator PASS; audyt produkcyjnych
  zależności: 0 high/critical, 3 moderate. Commit `77020314`: CI
  `34508054289` i Deploy `34508054158` success; health, 401 bez sesji i nowy
  mapper w uruchomionym API potwierdzone 2026-09-10.
  [Journal 2026-09-10](journal/2026-09-10-staff-appointment-response-minimization.md).
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

**Bezpieczeństwo:** lokalny audyt 2026-09-10 po odświeżeniu lockfile:
0 high/critical i 3 moderate. Bramka CI nadal blokuje high/critical. Pozostaje
przegląd umiarkowanych podatności.

Review 2026-09-10 wykazało dalsze ryzyka wiarygodności widoku i importu. F1/F4,
F2, F5/F7 i F6 są wdrożone; F3/F8 mają techniczną bramkę sprawdzoną na
izolowanym PostgreSQL i oczekują na rollout kodu oraz plan rzeczywistych danych.
Szczegóły i kryteria odbioru są w review.

**Stan wydania:** produkcja stoi na `8e57d9c6`. `d2d4ff18` (F3/F8) czeka na
zielone CI — do czasu rolloutu transakcyjny import nie działa na produkcji.

**Następny krok:** po zielonym CI poprawki limitu hooka doprowadzić `d2d4ff18`
do rolloutu, potem wykonać plan na rzeczywistych plikach importu i uzgodnić
bilans oraz jednostki bez zapisu. Po akceptacji planu i backupie wykonać import,
a następnie realny UAT właścicielki oraz odbiór powiadomień.

## Fakty zweryfikowane

- 2026-09-11 17:14: `api/healthz` 200 z `database`, `smtp` i `instagram` `ok`;
  panel 307 bez sesji, landing dev 200. To stan wdrożenia `8e57d9c6`, nie
  `d2d4ff18`. Nie użyto kont ani danych klientek.
- 2026-09-11 lokalnie: na izolowanym PostgreSQL 15 odtworzono awarię CI
  (`--testTimeout=2000`, 12/12 przerwanych w `beforeAll`), a po poprawce ten sam
  przebieg nie zgłasza już błędu hooka. Obie specyfikacje PostgreSQL 14/14,
  backend 414/414. Wyłącznie dane syntetyczne w kontenerze.
- 2026-09-11 lokalnie: izolowany PostgreSQL 12/12 potwierdził brak zapisu w
  planie, stabilne ID wariantów i FK po dwóch reimportach, wycofanie całej
  transakcji przy konflikcie oraz zachowanie aktualnego stanu istniejącego
  produktu bez jawnej flagi zastąpienia, zapis VAT i blokadę tekstu, który
  zostałby ucięty. Planista importu 6/6 i backend 414/414 PASS; użyto tylko
  danych syntetycznych. Raport rozróżnia rzeczywiste aktualizacje od rekordów
  bez zmian.
- 2026-09-11 po wdrożeniu `8e57d9c6`: CI `34571875569` i Deploy
  `34571875597` success. Mobilny test produkcyjny 390 x 844 na syntetycznych
  odpowiedziach potwierdził jawny błąd historii, brak fałszywego pustego stanu
  oraz przejście do prawidłowego pustego stanu po udanym ponowieniu. Jedyny
  błąd konsoli pochodził z celowo zasymulowanej odpowiedzi 503.
- 2026-09-11 lokalnie: test bramki deployu zaakceptował zakończony sukcesem CI
  `34538216816` tylko dla pełnego SHA `ef81d225...`; mock failure i skrócone
  SHA zostały odrzucone. Statyczna kontrola potwierdza położenie bramki przed
  instalacją i pracą wdrożeniową.
- 2026-09-11 po wdrożeniu `ef81d225`: CI `34538216816` i Deploy
  `34538216861` success. API health: database, smtp i instagram `ok`;
  uruchomiony artefakt zawiera blokadę `pessimistic_write`. Nie wykonano zapisu
  produkcyjnego ani nie użyto danych klientek. Ten rollout zakończył się przed
  CI, co dostarczyło świeżego dowodu dla F6.
- 2026-09-11 lokalnie: fail-first na PostgreSQL zapisał podwójne skutki dwóch
  równoległych finalizacji. Po blokadzie transakcyjnej PostgreSQL 9/9 i backend
  407/407 PASS; wyścig anulowanie–finalizacja kończy się jednym stanem. Użyto
  wyłącznie danych syntetycznych w odrębnym kontenerze.
- 2026-09-11 po wdrożeniu `b7d3e40e`: CI `34537339158` i Deploy
  `34537339266` success. API health: database, smtp i instagram `ok`; ogólna
  lista wizyt i chroniony katalog bez sesji zwracają 401. W 60 odpowiedziach
  publicznego katalogu nie było prywatnego opisu, prowizji, dat technicznych
  ani wewnętrznych relacji. Nie użyto kont ani danych klientek.
- 2026-09-11 lokalnie: testy fail-first potwierdziły wcześniejsze ujawnianie
  pól, a po poprawce backend 407/407 i panel 391/391 PASS. Typecheck, buildy,
  generator oraz walidacja OpenAPI potwierdzają osobne kontrakty klienta,
  personelu i admina. Nie użyto danych klientek ani produkcyjnych zapisów.
- 2026-09-10 po wdrożeniu `77020314`: CI `34508054289` i Deploy
  `34508054158` success. API health: database, smtp i instagram `ok`;
  bezpośredni odczyt wizyty bez sesji zwraca 401. Uruchomiony artefakt API
  wywołuje jawny mapper danych wizyty i nie mapuje kontaktu pracownika ani
  prywatnego opisu usługi. Nie użyto kont ani danych klientek i nie wykonano
  zapisu.
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
