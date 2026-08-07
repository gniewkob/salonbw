# STAN PROJEKTU — czytaj to jako PIERWSZE

> **Ten plik NADPISUJEMY, nie dopisujemy.** Ma zostać jednostronicowy.
> Zasady pracy: [`docs/HANDOFF_PROTOCOL.md`](./HANDOFF_PROTOCOL.md).
> Historia zadań: [`docs/journal/`](./journal/). Plan: [`docs/PROJECT_COMPLETION_PLAN.md`](./PROJECT_COMPLETION_PLAN.md).

**Ostatnia aktualizacja:** 2026-08-06 · **Aktualizował:** Claude

---

## Cel projektu

Własny panel dla **jednoosobowego salonu fryzjerskiego** (Salon Black & White,
Bytom). Właścicielka **Aleksandra pracuje jako admin** — rola „pracownik" jest
świadomie **poza zakresem** GO. Cel: w pełni działający panel na produkcji,
odejście od Booksy.

## Gdzie jesteśmy

**Fazy A i B (ścieżka techniczna) ukończone.** UAT §1 i §2 z
`docs/UAT_PLAN.md` przejrzane w całości (cztery przebiegi, 2026-07-30/31) —
pulpit, kalendarz, wizyta, finalizacja, karta klientki, magazyn (niskie
stany), statystyki/raport finansowy, ustawienia, cała ścieżka klientki
(rejestracja, rezerwacja, wiadomości, akceptacja zmienionego terminu, ocena,
zgody). **8 realnych bugów** znalezionych i naprawionych (Sentry CSP,
dublowanie sprzedaży produktów, „Płatność: opłacona", brak receptury w
karcie klientki — 2 warstwy, finalizacja z recepturą zawsze 400, baner
niskiego stanu na pulpicie zaniżał liczbę produktów, raport finansowy mylił
pełną kwotę transakcji z czystym przychodem usługowym — finding #4). **Zero
otwartych znanych bugów.** E4.4 (health-checki + „stan na start") wykonane.
Checklista `docs/PROJECT_COMPLETION_PLAN.md` §5 zaktualizowana — Fazy A+B
odhaczone.

**2026-08-06: E2.1 zamknięte decyzją ownera** — backup wykonany,
restore-drill świadomie pominięty, warunkowany dobrą kondycją bazy
(zweryfikowaną: 0 niezwalidowanych FK, 0 osieroconych wizyt, 98 migracji).
Ryzyko rezydualne (dump nieprzetestowany pod kątem odtwarzalności) przyjęte
świadomie — dziś bliskie zeru, bo baza ma wyłącznie dane syntetyczne;
materializuje się dopiero po E3. **Faza C jest tym samym odblokowana** —
pozostaje w niej cleanup danych testowych przed importem (zakres agenta).
Faza D (E4.6 miękki start, E3 import) i Faza E wciąż wymagają decyzji
właściciela.

## Fakty o produkcji (ZWERYFIKOWANE — data przy każdym)

| Fakt | Zweryfikowano |
|---|---|
| `panel.salon-bw.pl` → HTTP 307 (login) — **panel JEST na realnej domenie** | 2026-07-28 |
| `dev.salon-bw.pl` → nowy landing (Next), HTTP 200 | 2026-07-28 |
| `/healthz`: HTTP 200 · db/smtp/instagram ok | 2026-07-30 |
| SMS **nie działa** — pusty `SMSAPI_TOKEN` | 2026-07-23 |
| Sentry **frontendu** działa na żywo (0 błędów konsoli po fixie CSP; wcześniej blokowany na każdej stronie) | 2026-07-30 |
| Alert o rezerwacji: mail na `BOOKING_ALERT_EMAIL` fizycznie odebrany | 2026-07-29 |
| Dataset syntetyczny zgodny z grafikiem Oli; `scheduleViolations: 0` | 2026-07-30 |
| Statystyki klienta („Łączne wydatki") już nie dublują sprzedaży produktów (220 zł, było błędnie 255 zł) | 2026-07-30 |
| Hasło produkcyjnej roli PostgreSQL + sekrety GH (repo i `staging`-environment) zsynchronizowane; auto-deploy na push znów działa | 2026-07-30 |
| Hasło jedynego konta admina obrócone (Keychain); CAPTCHA po sesji UAT ustąpiła, login znów działa | 2026-07-30 |
| „Płatność: opłacona" na drawerze wizyty (fix `e05be6fc`) potwierdzone wizualnie na żywo | 2026-07-30 |
| Karta klientki → Historia pokazuje recepturę/formułę koloru obok zaleceń (fix `3910ab62`) | 2026-07-30 |
| `DATABASE_URL` w `staging`-environment i produkcyjnym `.env` zsynchronizowany z `PGPASSWORD`/`MYDEVIL_DB_PASSWORD` (były rozjechane, deploy padał) | 2026-07-30 |
| Finalizacja wizyty z materiałem z receptury (auto-fill) działa (fix `75f13952`); wcześniej zawsze 400 | 2026-07-31 |
| Pełna ścieżka klientki (wiadomości, akceptacja terminu, ocena, zgody) działa end-to-end na żywo | 2026-07-31 |
| Ocena klientki widoczna w `/reviews` admina; pulpit poprawnie liczy „8" (4 brak+4 niski) zamiast „4" (fix `1b64834e`) | 2026-07-31 |
| §1.8/§1.9/§1.10 UAT (magazyn/statystyki/ustawienia) przejrzane | 2026-07-31 |
| Raport finansowy poprawnie rozdziela usługi/towary/napiwek (fix `7b38e606`); „Sprzedaż usług" 130 zł zamiast 185 zł na tej samej wizycie #182 | 2026-07-31 |
| Tabela „Dane w podziale na pracowników" pokazuje wizyty Aleksandry (rola `admin`) zamiast zer (fix `5a1cdc09`); wygasła sesja panelu wraca na `/auth/login` zamiast landingu (fix `d95ede94`) | 2026-08-01 |
| `/appointments?status=online_pending` pokazuje wszystkie 4 rezerwacje zgodnie z badge'em topbara (fix `b4249b81`); przeterminowane oznaczone „Niedobyta — do potwierdzenia" | 2026-08-04 |
| Kondycja bazy: 22 MB, 98 migracji, **0 niezwalidowanych FK, 0 osieroconych wizyt**, `/healthz` DB 17 ms | 2026-08-06 |
| Dataset odświeżony: 20 klientek, 70 wizyt, **43 w przyszłości** (było 0), tygodnie 29–36, `scheduleViolations: 0`; śmieci po UAT usunięte | 2026-08-06 |
| Logowanie Google **nieaktywne** — `/auth/social/google` = 404, brak `GOOGLE_*` w `.env` prod (stan zamierzony, kod gotowy) | 2026-08-06 |
| Web-push aktywny: klucze VAPID w `.env`, log `[PushService] Push notifications configured successfully`, `sw.js` serwowany (200) | 2026-08-07 |
| Przypomnienia czytają `reminder_settings` z bazy (były ignorowane na rzecz env); seed zabramkowany; martwy `reminder.service` usunięty — potwierdzone w `dist` na serwerze | 2026-08-07 |
| **`SMSAPI_TOKEN` i `WHATSAPP_TOKEN` puste** → SMS martwy, każda wysyłka WhatsApp to ciche no-op; przypomnienia wychodzą e-mailem | 2026-08-07 |

> Fakt starszy niż ~7 dni = niepewny. Zweryfikuj ponownie (§6 protokołu).

## Ostatnio zrobione

- **Audyt „ukrytych" funkcjonalności + naprawa 3 znalezisk** (2026-08-07,
  `eadf6ee9` + `eea4e9ed`; pełny zapis
  `docs/journal/2026-08-07-audyt-martwego-kodu.md`). Po sprawie
  `PushService` (zero wywołań) właściciel poprosił o sprawdzenie, czy jest
  tego więcej. 377 endpointów skonfrontowanych ze 166 wywołaniami
  frontendów, 114 tras panelu z linkami, flagi env ze stanem produkcji.
  **Najpoważniejsze znalezisko:** `automatic-reminder.service` czytał
  konfigurację ze zmiennych środowiskowych i **w ogóle nie dotykał tabeli
  `reminder_settings`** — cała strona ustawień przypomnień w panelu była
  dekoracją, a `preferred_channel` nie był czytany przez nic. Naprawione u
  źródła (baza jest źródłem prawdy, env fallbackiem; kanał preferowany +
  drugi jako zapas). Usunięty martwy `reminder.service` (WhatsApp-only,
  cron co godzinę bez efektu). Zabramkowany `POST /database/seed-test-data`
  (rola admina nigdy nie chroniła produkcji, bo właścicielka JEST adminem).
  Przywrócone dwa zgubione wejścia w nawigacji („Kategorie usług",
  „Ruchy magazynowe"). **Zweryfikowane w `dist` na serwerze.**
  Niezrealizowany świadomie punkt 4 audytu (usuwanie martwych stron).
- **Web-push: alert o nowej rezerwacji na telefon** (2026-08-07,
  `26cc095f`; pełny zapis
  `docs/journal/2026-08-07-web-push-alert-o-rezerwacji.md`). Domyka lukę
  z E2.11: alert o rezerwacji docierał do salonu **jednym kanałem —
  mailem**. Infrastruktura push istniała, ale `PushService` nie miał ani
  jednego wywołania, panel nie miał Service Workera, a klucze VAPID nie
  były ustawione. Dodane: trigger przy rezerwacji klientki (odbiorcy =
  przypisany pracownik + wszyscy admini, bo właścicielka pracuje jako
  admin), `sw.js` bez cache'owania, karta subskrypcji na `/account`
  (per-urządzenie, rozróżnia „zablokowane" od „niezapytane"), klucze
  VAPID na produkcji. **Zweryfikowane:** `sw.js` 200, log
  `Push notifications configured successfully`, `/healthz` ok.
  **NIE zweryfikowane klikaniem** — CAPTCHA po wielokrotnych logowaniach
  w sesji; realne domknięcie E2.11 wymaga jednorazowego testu na
  telefonie (patrz Follow-up w journalu).
- **Dataset na kolejny miesiąc + audyt gotowości Google** (2026-08-06,
  `764ecb68`; pełny zapis
  `docs/journal/2026-08-06-dataset-na-miesiac-i-audyt-google.md`).
  Właściciel poprosił o dane do samodzielnych testów scenariuszy.
  Kalendarz był pusty od dziś w przód (wizyty kończyły się 2026-08-05).
  **Realna przyczyna nie leżała w stałych, tylko w alokatorze:** przyszłe
  wizyty dostawały wszystkie dni posortowane rosnąco, a alokator brał
  pierwszy wolny slot — `preferredOffset` był dla nich martwy, więc
  wszystko upychało się tuż za kotwicą. Naprawione lustrem logiki
  przeszłej (`preferredFutureCandidates`); wolumen podniesiony do 20
  klientek/70 wizyt, rozrzut w przód 14→30 dni. Po `apply` (z backupem,
  dry-runem i weryfikacją): **43 wizyty w przyszłości** rozłożone na
  tygodnie 29–36, `scheduleViolations: 0`. Przy okazji zniknęły śmieci po
  UAT — **pozycja cleanupu z Fazy C zamknięta**. Zaudytowane też
  logowanie Google: kod gotowy, ale nieskonfigurowane (404 na
  `/auth/social/google`) — lista kroków do uruchomienia w journalu.
- **Live bug: przeterminowane rezerwacje oczekujące niewidoczne na liście +
  flaga „niedobyta"** (2026-08-04, `b4249b81`; pełny zapis
  `docs/journal/2026-08-04-niedobyte-oczekujace-fix.md`). Zgłoszenie
  właściciela: badge topbara pokazywał 4 oczekujące rezerwacje online, ale
  `/appointments?status=online_pending` po kliknięciu „Zarządzaj" była
  pusta. Przyczyna: filtr statusu oczekującego domyślnie zawężał okno dat
  wyłącznie w PRZÓD (`dziś..+90d`) — błędne założenie, że rezerwacje
  oczekujące zawsze mają termin w przyszłości; rezerwacja, której termin
  minął bez potwierdzenia/odrzucenia, wypadała z okna mimo że liczyła się
  do badge'a. Fix: okno rozszerzone do `dziś-90d..dziś+90d`
  (`resolvePendingStatusDateWindow`). Doprecyzowane przez właściciela w
  trakcie pracy: taka przeterminowana rezerwacja oczekująca powinna być
  wyraźnie oznaczona jako wymagająca decyzji Oli (klientka mogła odwołać
  telefonicznie/osobiście bez aktualizacji systemu) — dodana pochodna flaga
  `isOverduePending` (status pending + termin minął), wiersz dostaje
  podświetlenie `table-danger`, etykietę „Niedobyta — do potwierdzenia" +
  podpowiedź, a przyciski Potwierdź/Odrzuć (wcześniej tylko dla
  `online_pending`) rozszerzone też na `rescheduled_pending`. **Zweryfikowane
  na żywo:** lista pokazuje wszystkie 4 rezerwacje zgodnie z badge'em,
  każda poprawnie oznaczona (wszystkie 4 to pozostałości testowe z UAT —
  patrz „Następny krok" niżej, do sprzątnięcia).
- **Backlog ETAP 5: przekierowanie po wygaśnięciu sesji + admin w rankingu
  pracowników** (2026-08-01, `d95ede94` + `5a1cdc09`; pełny zapis
  `docs/journal/2026-08-01-backlog-session-redirect-i-employee-ranking.md`).
  Po zamknięciu Faz A+B, podjęte dwa drobne 🟡 znaleziska nie wymagające
  decyzji ownera: (1) wygasła sesja panelu (realny 401, nie jawne
  „Wyloguj") przekierowywała na publiczny landing zamiast `/auth/login` —
  `AuthContext` teraz rozróżnia oba wyzwalacze, sesja wygasła wraca na
  `/auth/login?redirectTo=<strona>`; (2) tabela „Dane w podziale na
  pracowników" pokazywała zera przy Aleksandrze (rola `admin`, nie
  `employee`) mimo że wiersz „Łącznie" poprawnie sumował jej wizyty —
  `getEmployeeRanking`/`getCommissionReport` teraz uwzględniają każdego,
  kto FAKTYCZNIE ma przypisane wizyty, nie tylko `role: Employee`.
  **Zweryfikowane na żywo:** wiersz „Aleksandra Bodora · 1 · 45 min ·
  130,00 zł" (było: same zera), wykres „Aleksandra Bodora (100%)" (było:
  „Brak danych do wykresu"). Przy okazji sprawdzone i odrzucone jako
  fałszywy alarm: przycisk „pobierz raport Excel" generuje `.csv`, ale
  celowo — separator `;`, BOM, przecinek dziesiętny — dokładnie pod polski
  Excel; nie jest bugiem.
- **E4.4 wykonane + checklista planu zsynchronizowana** (2026-07-31, wpis
  `docs/journal/2026-07-31-e44-stan-na-start.md`): health-checki na żywo
  (`/healthz` ok, panel 307/login, dev.landing 200, ostatni deploy success),
  `docs/PROJECT_COMPLETION_PLAN.md` §5 zaktualizowana — Faza B (UAT) i E4.4
  odhaczone. Podsumowanie: ścieżka techniczna do produkcji (Fazy A+B) jest
  ukończona; wszystko co zostało (E2.1 restore-drill, E4.6 miękki start, E3
  import, Faza E) wymaga decyzji/działania właściciela, nie kodu.
- **Finding #4 naprawiony: raport finansowy nie myli już pełnej kwoty
  transakcji z przychodem usługowym** (2026-07-31, `7b38e606`; pełny zapis
  `docs/journal/2026-07-31-finding-4-statistics-revenue-fix.md`). Root
  cause dwuwarstwowy: `resolveAppointmentPrice()` zwracało `paidAmount`
  (usługa+dodatki+produkty−rabat+napiwek) wprost jako „przychód usługowy" w
  pulpicie/wykresie przychodów/rankingu pracowników/raporcie prowizji; a
  osobne zapytania „przychód z produktów" czytały WYŁĄCZNIE starą tabelę
  `product_sales` (nigdy `warehouse_sales`) — ten sam dwutabelowy problem
  co finding #2, tu zerujący „Sprzedaż towarów" i przez to jeszcze bardziej
  zawyżający „usługi". Nowe `resolveServiceRevenue()` odejmuje napiwek i
  sprzedaż produktów POWIĄZANYCH Z TĄ WIZYTĄ od `paidAmount`; nowe
  `getProductSaleRows()` to jedno zapytanie świadome obu tabel, z którego
  każdy wywołujący agreguje po dniu/pracowniku/wizycie zamiast duplikować
  zapytanie. `getServiceRanking` przy okazji przepisane z surowego SQL na
  fetch-encji + redukcja (koniec z ręcznym cytowaniem aliasów). Świadomie
  NIETKNIĘTE: `getCashRegister` (saldo kasy = poprawnie pełna kwota) i
  `getClientStats.topClients.totalSpent` (poprawnie „ile klient wydał
  łącznie"). **Zweryfikowane na żywo na TEJ SAMEJ wizycie #182:** „Sprzedaż
  usług" 130,00 zł (było 185,00 zł), „Sprzedaż towarów" 59,60 zł (było
  0,00 zł), „Utarg" 189,60 zł = usługi+towary bez napiwku — w pełni spójne
  z tabelą pracowników. **UAT §1+§2 nie ma już żadnego znanego,
  udokumentowanego bugu finansowego.**
- **UAT Fazy B — zamknięcie §1.8/§1.9/§1.10 + bug pulpitu (niski stan)**
  (2026-07-31, `1b64834e`; pełny zapis
  `docs/journal/2026-07-31-uat-faza-b-trzeci-przebieg.md`): magazyn (niskie
  stany), statystyki (raport finansowy + eksport + usługi + prowizje),
  ustawienia (online-booking, katalog usług) — wszystko czyste. Potwierdzone
  też: ocena 5★ klientki z poprzedniego przebiegu widoczna poprawnie w
  `/reviews`. **Znaleziony i naprawiony realny bug:** baner „niskim stanem
  magazynowym" na pulpicie czytał WYŁĄCZNIE `lowStockCount`, ignorując
  rozłączną kategorię `outOfStockCount` — pokazywał „4" zamiast realnych 8
  produktów wymagających uwagi (4 niski stan + 4 całkowicie wyprzedane), a w
  skrajnym przypadku (same produkty wyprzedane, zero „tylko niskich") baner
  znikałby CAŁKOWICIE mimo pustego magazynu. Fix uwzględnia obie kategorie w
  warunku i liczbie. **UAT §1 i §2 z `docs/UAT_PLAN.md` przejrzane w
  całości** — formalne zamknięcie i decyzja o Fazie C należy do właściciela.
- **UAT Fazy B — pełna ścieżka klientki + bug finalizacji z recepturą**
  (2026-07-31, `75f13952`; pełny zapis
  `docs/journal/2026-07-30-uat-faza-b-drugi-przebieg.md`): dokończenie §2 na
  nowym koncie testowym — wiadomości (dwukierunkowe), reschedule +
  akceptacja przez klientkę, edycja zgód (WhatsApp/e-mail), ocena odbytej
  wizyty (5★+komentarz), przeplatane z akcjami właścicielki. **Znaleziony i
  naprawiony realny bug:** finalizacja KAŻDEJ wizyty dla usługi z recepturą
  (np. farbowanie) zawsze kończyła się 400 — auto-wypełniony materiał z
  receptury wysyłał dodatkowe pole `productName`, którego ściśle
  wybielona (`forbidNonWhitelisted`) DTO backendu nie akceptuje. Błąd BYŁ
  pokazywany (nie cichy), ale jako surowy komunikat walidacji NestJS,
  niezrozumiały dla właścicielki, i całkowicie blokował finalizację. Fix:
  payload `usageMaterials` mapowany do kształtu przewodowego przed wysyłką
  (jak już robił sąsiedni `usageItems`). Zweryfikowane na żywo na TEJ SAMEJ
  wizycie, która wcześniej 400-owała. Odkryta i naprawiona przy okazji:
  własna metodologiczna pułapka (dwie karty przeglądarki dzielą jeden słoik
  ciasteczek — logowanie klientki w jednej karcie wylogowuje admina w
  drugiej; nie dotyczy realnych użytkowników, tylko równoległego testowania).
- **UAT Fazy B — receptura w karcie klientki + incydent deployu** (2026-07-30,
  `151565ef` + `3910ab62`; pełny zapis
  `docs/journal/2026-07-30-uat-faza-b-receptura-i-deploy-incydent.md`):
  §2a item 7 wykazał, że karta klientki → Historia pokazywała zalecenia, ale
  NIE recepturę/formułę koloru mimo że dane istnieją w bazie — backend nigdy
  ich nie czytał. Naprawa w 2 commitach (pierwszy niewystarczający: relacja
  `eager` na encji NIE jest auto-joinowana przez `createQueryBuilder()`, tylko
  przez `repo.find()` — drugi commit dodał jawny `leftJoin` + asercję
  regresyjną sprawdzającą sam wywołany zapytanie, nie tylko kształt mocka).
  **Po drodze realny incydent produkcyjny:** push pierwszego commitu wywołał
  auto-deploy, który padł na „Validate DB connectivity" — `DATABASE_URL` w
  `staging`-environment miał wbudowane STARE hasło (rozjechane względem
  poprawnego `PGPASSWORD`/`MYDEVIL_DB_PASSWORD` z wcześniejszej dzisiejszej
  synchronizacji). Produkcja działała cały czas (`/healthz` ok, stary proces
  trzymał ważne połączenie w pamięci). Zdiagnozowane bez rotacji (na wyraźne
  życzenie właściciela) przez porównanie fingerprintów SHA-256 haseł przez
  SSH; naprawione odbudowaniem `DATABASE_URL` z już-poprawnego `PGPASSWORD`
  (bez tworzenia nowego hasła). Nieudany deploy zdążył też wgrać nowy bundle
  panelu przed padnięciem na kroku bazy — produkcja serwowała stary HTML z
  odwołaniami do nieistniejącego już `_next/static/<buildId>/`, dając 404 na
  każdej stronie; naprawione tym samym redeployem (`target=api`+`target=panel`).
  **Błąd własny:** jedna komenda diagnostyczna przypadkiem wypisała stare
  (już nieważne) hasło w widocznym outpucie sesji — zgłoszone właścicielowi
  natychmiast; dalsze operacje poszły przez plik tymczasowy bez `cat`/`grep`
  pełnej wartości.
- **UAT Fazy B — pierwszy przebieg + 3 realne bugi naprawione** (2026-07-30,
  `c432ae4a` + `e05be6fc`; pełny zapis
  `docs/journal/2026-07-30-uat-faza-b-pierwszy-przebieg.md`): przejście
  ścieżki właścicielki (pulpit, kalendarz, szczegóły wizyty) i pełnej
  finalizacji z dodatkową usługą/sprzedażą/materiałem/rabatem/napiwkiem/
  recepturą (sprawdzian §2a w 9 miejscach), oraz ścieżki klientki
  (rejestracja + rezerwacja online, mobile 390×844). Naprawione: (1) CSP
  panelu blokował Sentry frontendu na każdej stronie (brak
  `*.ingest.de.sentry.io`); (2) statystyki klienta dublowały sprzedaż
  produktu (dwie tabele, `product_sales`+`warehouse_sales`, sumowane
  zamiast wzajemnie wykluczające się); (3) etykieta „Płatność" zawsze
  pokazywała „nieopłacona" niezależnie od stanu — dwuwarstwowy bug
  (martwe pole `paymentStatus` + brakujące `paidAmount` w mapowaniu
  `calendar.tsx`→drawer). Po drodze: deploy padał dwukrotnie z powodu
  desynchronizacji sekretów `staging`-environment po wcześniejszej w tej
  samej sesji rotacji hasła bazy — naprawione, auto-deploy na push
  ponownie działa. **Nienaprawiony, udokumentowany finding:** raport
  finansowy (`statistics.service.ts`) traktuje `paidAmount` (pełna kwota
  transakcji) jako czysty przychód usługowy — zawyża „Sprzedaż usług
  brutto"/„Utarg" o wartość produktów+napiwku sprzedanych przy tej samej
  wizycie. Wymaga osobnego, przetestowanego zadania.
- **PR #1477 zmergowany i wdrożony + produkcyjny rollout danych** (2026-07-30,
  `68a215d7`): generator syntetycznych wizyt respektuje wyłącznie aktywny
  grafik Oli. Pełny zapis: `docs/journal/2026-07-30-synthetic-schedule-rollout.md`.
- **Faza A zamknięta: E2.2 + E2.5 + E2.11 + E4.2** (2026-07-29): hasło admina
  i poświadczenie PostgreSQL obrócone (od tego czasu obrócone ponownie);
  Sentry (backend) przyjął testowe zdarzenia; alert rezerwacji fizycznie
  odebrany; produkcja zresetowana do datasetu syntetycznego bez PII.
- Starsza historia (deploy statyków, visual sweep, porządki repo, PR #1465/#1466,
  protokół handoff) — patrz `docs/journal/` dla pełnych zapisów.

## Następny krok (konkretnie)

**Faza C zamknięta** — E2.1 zamknięte decyzją ownera, a cleanup danych
testowych wykonał się przy okazji resetu datasetu 2026-08-06 (baza zawiera
wyłącznie świeże dane syntetyczne + 2 konta chronione).

**Trwa: właściciel samodzielnie testuje scenariusze** na datasecie z
2026-08-06 (43 wizyty w przyszłości, wszystkie statusy poza `in_progress`).

Wszystko pozostałe (E4.6 miękki start, E3 import, Faza E) wymaga
decyzji/działania właściciela — patrz „Zablokowane na ownerze" niżej.
Pozycje w zakresie agenta, gotowe do podjęcia w dowolnej chwili: batch
20 otwartych PR-ów dependabota, ETAP 5 P1 (audyt widoczności akcji,
typing auth/social, Service Worker pod web-push).

Drobne, nieblokujące pozycje do backlogu ETAP 5 (nie wymagają decyzji, tylko
czasu — do podjęcia w dowolnej kolejnej sesji bez pytania ownera):
- Surowe komunikaty walidacji backendu trafiają czasem wprost do UI zamiast
  czytelnego PL (brak aktualnej, konkretnej reprodukcji — obserwacja, nie
  akcja).
- Przed Fazą C (import danych, gdy się odblokuje) posprzątać dane testowe ze
  WSZYSTKICH CZTERECH przebiegów UAT z 2026-07-30/31 — pełne listy w
  journalach: `2026-07-30-uat-faza-b-pierwszy-przebieg.md`,
  `2026-07-30-uat-faza-b-receptura-i-deploy-incydent.md`,
  `2026-07-30-uat-faza-b-drugi-przebieg.md`,
  `2026-07-31-uat-faza-b-trzeci-przebieg.md`. Do tej listy dopisać też 4
  rezerwacje `online_pending` wykryte 2026-08-04 (klienci 87/91/95/97 —
  „SYNTHETIC Klient 03/07/11" + „UAT Klientka Testowa") — dziś wyświetlają
  się administratorce jako fałszywie „Niedobyta — do potwierdzenia".

## Zablokowane na ownerze

| # | Co | Faza |
|---|---|---|
| E4.6 | Miękki start — decyzja o faktycznym udostępnieniu panelu klientkom | D |
| E3 | Import zrzutu Versum — wsad danych + jawna zgoda ownera na każdym kroku | D |
| E2.3 | Decyzja o domenie landingu (**nie blokuje panelu**) → E4.5 cutover + checklista Meta | E |
| E0.2 | Przegląd prawny (radca) przed szerokim pozyskiwaniem danych | E |
| E2.4/E2.7/E2.8/E2.9 | SMS jako 2. kanał alertu / `UPLOADS_DIR` / test WhatsApp / NIP-REGON | E |
| ETAP 3a | Zatwierdzenie nazw kategorii produktów (propozycja w planie) | — |

## Aktywny stan repo

- Gałąź: `master`; poza `master` brak lokalnych i zdalnych gałęzi roboczych.
- Otwarte PR-y: 0.
- CI i deploy `master` są wymagane jako końcowa bramka każdego kolejnego zadania.

## Uwaga o równoległych strumieniach

Na repo pracują **równolegle** owner/Codex (ostatnio: landing — footer, founder
CMS, treści prawne) i Claude (panel, plan, weryfikacja, operacje produkcyjne).
**Zawsze `git fetch` i rebase przed startem** — master potrafi przesunąć się o
kilka commitów między sesjami, a skonfliktowany PR cicho blokuje CI.
