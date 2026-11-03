# Stan projektu SalonBW

**2026-10-31 — zależności bezpieczeństwa (PR w toku):** lockfile podnosi `follow-redirects` do 1.16.2 oraz `joi` do 18.3.1; manifest npm API i bramka deployu sprawdzają wersje osobno od pnpm; lokalny audit nie zgłasza HIGH/CRITICAL. Walidacja CI i review pozostają wymagane przed merge. Nie wykonano wdrożenia. PostgreSQL: osobna sesja TCP wykazała `SHOW ssl=off`; ryzyko i trasa sieci pozostają otwarte w #1573. Szczegóły: [journal](journal/2026-10-31-security-dependencies.md).

**Bieżąca aktualizacja — 2026-10-29:** PR [#1556](https://github.com/gniewkob/salonbw/pull/1556) został scalony do `master`. Według zgłoszonego raportu operacyjnego, wdrożenie poprawek P0 panelu i API na produkcję otrzymało `PRODUCTION_P0_DEPLOYMENT=PASS` przy release `d017aebd3f6d0e95100b52d7cdc286507a959892`. Nie jest to potwierdzenie odbioru biznesowego właścicielki: [UAT kalendarza/CRM #1531](https://github.com/gniewkob/salonbw/issues/1531), [test ścieżki rezerwacji #1529](https://github.com/gniewkob/salonbw/issues/1529) i [bramki wydań #1557](https://github.com/gniewkob/salonbw/issues/1557) pozostają osobnymi zadaniami. Booksy nie zostało przełączone w ramach tego PR. Akapity poniżej opisujące `NO-GO` z 2026-10-28 są **historycznym stanem sprzed zatwierdzonego wdrożenia**, a nie aktualnym stanem P0.

**Aktualny stack:** Node.js 22 / pnpm 10.14.0 / Next.js 15 / NestJS 11. [README](../README.md) opisuje bieżące katalogi i komendy; [status wycofania legacy PHP](LEGACY_PHP_RETIREMENT.md) jest oparty na dowodach operacyjnych PR #1520 i #1521, nie na nowej inspekcji SSH.

**Aktualizacja: 2026-10-28 · Codex** (synchro P0 / DEV auth UAT PASS; produkcja nadal NO-GO)
Zasady: [HANDOFF_PROTOCOL.md](HANDOFF_PROTOCOL.md).

### Release safety follow-up PR #1556 (2026-10-29)

CI `2cdfa579` [#40787371174](https://github.com/gniewkob/salonbw/actions/runs/40787371174) **9/9 PASS**,
ale niezależny review wykrył dwa nowe blokery przed PROD:
P1 — błędne porównanie SHA workflow z SHA aplikacji przy historycznym rollbacku;
P2 — niekompletny snapshot mógł zostać przyjęty do odtwarzania.
Nowy kandydat zawiera rozdzieloną weryfikację dwóch SHA, kontrolę wszystkich
pozycji manifestu snapshotu przed usunięciem runtime i testy regresyjne.
**Nowe exact-SHA CI i review oraz pełne hosted DEV UAT i restore drill nadal wymagane.**
PR pozostaje Draft / produkcja NO-GO. Nie zmieniono Booksy ani runtime produkcji.
Dziennik: [2026-10-29 release rollback review guards](journal/2026-10-29-release-rollback-review-guards.md).

### Poprawka uwag review #1543/#1544 (2026-10-28)

Kandydat nad `c4399429` przywraca wykonywalność dwóch skryptów i blokuje
oferowanie/zapis/przesunięcie wizyty, jeżeli początek lub koniec traci UTC
przy obecnym PostgreSQL timestamp without time zone. Bez migracji i bez
zmiany TZ procesu. Jawny admin override nie omija tej kontroli.
Fail-first: 4 regresje DST oraz test executable FAIL przed poprawką.
Po poprawce: backend **525/525** (UTC, bez skipów), celowane unit Warsaw
**78/78**, lokalny PostgreSQL **25/25** w UTC i Europe/Warsaw, ops **18/18**,
typecheck/lint/build i restore fixture PASS. Dokładne CI nowego SHA i review
pozostają bramkami przed wdrożeniem; brak zgody na merge/produkcję/Booksy.
[Journal poprawki](journal/2026-10-28-dst-storage-executable-review-fix.md).

### DEV Selective Deployment & Recovery — polityka 2026-10-27

Na osobnej gałęzi bez modyfikacji PR #1543 wprowadzono izolowane
wdrażanie `development all` jako **API → panel → landing**: oddzielny
run, snapshot i rollback dla każdej aplikacji. Zdrowe komponenty
zachowują poprzednio zaakceptowany runtime nawet gdy kolejny target
przerwie deploy. Produkcja zachowuje wcześniejsze zasady.
Scenariusze UAT mają niezależne statusy PASS/PARTIAL/BLOCKED;
nieudany skrypt testowy lub rozbieżność pola daty nie wymaga
automatycznego cofnięcia wszystkich aplikacji.
Szczegóły i ograniczenia: [DEV_DEPLOYMENT_POLICY.md](DEV_DEPLOYMENT_POLICY.md).
Ostatni pomiar DEV (2026-10-28): trzy aplikacje na `c4399429`, syntetyczny UAT
i selektywny host-level restore landingu PASS. Nowy kandydat nie jest wdrożony.
Produkcja pozostaje NO-GO; pełne dowody i granice UAT w
[raporcie #1530](https://github.com/gniewkob/salonbw/issues/1530#issuecomment-6452374898).

### Release P0 — synchronizacja z master i bieżące DEV UAT (2026-10-28)

Nowy kandydat integracyjny [PR #1556](https://github.com/gniewkob/salonbw/pull/1556) zawiera **P0 PR #1543 + selektywny DEV rollback PR #1544**
oraz cztery nowsze commity master z ręcznym sprawdzaniem syntetycznego konta.
Przeniesiono bez utraty kroków oba zestawy kontroli CI (rollback i testy credential).
Nie wykonano merge ani deploymentu produkcyjnego w tym zadaniu.

**Dowody:** PR #1543 CI 9/9 success [40569416539](https://github.com/gniewkob/salonbw/actions/runs/40569416539);
PR #1544 CI 9/9 success [40581862244](https://github.com/gniewkob/salonbw/actions/runs/40581862244).
Syntetyczne konto DEV [naprawa 40775649027](https://github.com/gniewkob/salonbw/actions/runs/40775649027)
`UPDATED`, [weryfikacja 40775895601](https://github.com/gniewkob/salonbw/actions/runs/40775895601)
`MATCH`, [hosted auth UAT 40776209505](https://github.com/gniewkob/salonbw/actions/runs/40776209505)
PASS (anonimowy 401, admin 200, system-only 403, zero booking writes).
Aktualne aplikacje DEV użyte w UAT to `c4399429a7f9a7804161847f79d6d70a64a025d1`.

**Release nadal NO-GO:** nowy dokładny SHA wymaga ponownego CI/review,
pełnego syntetycznego hosted booking UAT (zapis 403/409, harmonogram, DST,
statystyki, rejestracja i cennik), próby odtworzenia/rollback oraz smoke
produkcyjnego po formalnym deployu. Booksy pozostaje aktywne zgodnie z osobną decyzją.

### Dodatkowy review: zgoda na nakładanie wizyt (2026-10-27)

Fail-first `87fbc11e` ([CI 40559136014](https://github.com/gniewkob/salonbw/actions/runs/40559136014))
wykazał, że po zamknięciu i ponownym otwarciu formularza z identycznymi
polami przycisk `Dodaj mimo to` pozostawał zaakceptowany bez nowego sprawdzenia.
Jedna nowa regresja nie przeszła; 458 innych testów panelu przeszło.
Poprawka `81d323a` dodaje `open` do klucza zatwierdzenia i unieważnia
stare zgody oraz oczekujące sprawdzenia. Test panelu po poprawce:
**459/459 PASS** w 102 suite (job `122384627721`). Pełne CI aktualnego
commitu oraz review i hosted dev UAT pozostają bramkami wydania.
Nie uruchamiać legacy `e2e.yml` bez zweryfikowanej izolacji generycznych
`MYDEVIL_DB_*` — workflow nie wymusza targetowania syntetycznej bazy dev.
Szczegóły: [journal review](journal/2026-10-27-overlap-drawer-lifecycle-review.md).

### Integracja wydania dev P0 (2026-10-27) — nowa gałąź, nadal NO-GO

Branch `codex/dev-release-integrated-p0-20261027`, od preflight #1541 / #1540,
łączy nowszy backend transakcyjny (#1535/#1536/#1539/#1540), sprawdzony kod
statystyk z działającego dev `4cc6faf3` (sprzedaż produktu i wizyta w różnych
dniach), izolowane frontendowe poprawki #1538 oraz admin-only manual-overlap
z #1524 (uprawnienie 403 i ten sam lock). Bez merge/deploy, bez zmian na
produkcyjnym lub dev serwerze. Nie przenoszono zmian usuwających Booksy UI
z odrębnych dev commitów. Dziennik: [integration](journal/2026-10-27-integrated-dev-release-candidate.md).

**Release gate:** sprawdzić dokładne CI nowej gałęzi (backend/Jest/PG, landing,
panel, cross-date statistics), dwa TZ UTC i Europe/Warsaw, niezależny review,
then izolowany hosted restore/rollback + dev UAT. Nie uruchamiać deploy na
samym #1540 ani na kodzie bez dowodu zachowania aktualnie działających zmian.


Historia: [docs/journal](journal/). Plan ogólny: [PROJECT_COMPLETION_PLAN.md](PROJECT_COMPLETION_PLAN.md).

## Cel i zakres

Jeden salon, właścicielka pracuje jako admin; pracownicy poza zakresem GO.
Klientka samodzielnie rezerwuje i uzgadnia wizyty, właścicielka obsługuje dzień
pracy, historię zabiegów i rozliczenie. Priorytet ownera z 2026-09-06:
**pewność, że cały proces działa niezawodnie**.

### P0 rezerwacji — preflight dev (2026-10-27)

**NO-GO dla deployu niezmienionego #1540 `39ffbfa0`.** Jego dokładne CI
[40500443961](https://github.com/gniewkob/salonbw/actions/runs/40500443961)
potwierdzone: 9/9 jobs, backend 505/505, PG 25/25; frontendy pomijają build/test.
Świeżo lokalnie: backend 505/505 UTC, PG 25/25 UTC i Europe/Warsaw.

Nowy bloker składu wydania: kandydat cofa poprawkę statystyk z obecnego dev
`4cc6faf37cd8d53db16be05e166b1c8a7c497885`. Osiem testów cross-date z kodu
dev FAIL na #1540 (także UTC/Warsaw), PASS z wdrożonym kodem statystyk.
#1540 zawiera przodków #1535/#1536/#1539, ale nie zawiera osobnego #1538
(rejestracja/ciągłość usługi/cena). Nie ma zwalidowanego wspólnego SHA wydania.

Odczytowo potwierdzono osobne katalogi/bazy/role/klucze, cookie dev_,
wyłączoną wysyłkę i dostęp przez bramkę. Wszystkie 5 adresów kont dev ma
zarezerwowane domeny testowe; brak telefonów/adresów/dat urodzenia. Pełny audyt
wolnych pól i uprawnień pozostaje otwarty. Czytelny indeks backupu dev nie jest
dowodem pełnego restore. Lokalny syntetyczny dump/restore PASS.

**Nie wykonano deployu, restartu, merge ani hostowanego UAT/zapisów.**
Dev API nadal `4cc6faf3`; landing `54671baf`; panel `1e030056`.
Produkcja: API/live header `328d362f`, frontendy taki sam SHA w konfiguracji;
health/HTTP OK. Pełne SHA, macierz UAT i granice dowodów:
[journal preflight](journal/2026-10-27-dev-release-preflight.md).

**Następny krok:** złożyć SHA zachowujące poprawkę statystyk i #1540,
uzgodnić #1538, wykonać dokładne CI/review i przygotować prywatne snapshoty
oraz próbę odtworzenia przed deployem wyłącznie dev. #1537/#1530 otwarte;
produkcja i Booksy bez zmian.

## Gdzie jesteśmy

Istnieje rozbudowany, działający system. Po imporcie Booksy, wdrożeniu trzech
poprawek klientek i odtworzeniu kont technicznych pełna regresja produkcyjna
przeszła 23/23. **System jest gotowy do UAT ownera; nie jest to jeszcze zgoda
na szeroki start ani przełączenie przyszłych rezerwacji z Booksy.**
Raport, dowody i kryteria akceptacji:
[journal 2026-09-06](journal/2026-09-06-reliability-audit-and-confirmed-reminders.md).

## Ostatnio zrobione

- **Dwie odrębne instalacje i domena główna (2026-10-25, PR #1516).**
  `salon-bw.pl` obsługuje nowy landing, panel/API zachowują domeny.
  Dev ma własne dev-panel/dev-api, bazę, klucze i cookies, bramkę dostępu,
  noindex i wyłączone wiadomości. Live: godziny odpowiadają grafikowi ownerki,
  60/60 cen i czasów usług zgodnych z API, logowanie/pulpit dev desktop/mobile
  oraz wzajemne odrzucenie tokenów produkcji/dev. Meta: trzy adresy prawne
  oraz domena/witryna zapisane i odczytane ponownie. PR #1517 usunął błąd
  porównania /home i /usr/home, zachowując istniejące linki. Finalny runtime
  obu środowisk: `328d362f`; CI `40290290749`, produkcja `40290290857`, dev API
  `40290383892`, dev frontendy `40291133185` success. Wszystkie sześć wersji
  sprawdzone live, pulpity desktop/mobile bez błędów i overflow. Końcowa
  regresja `40291708798` (próba 2) success: 23/23, bez pominięć.
  [Journal](journal/2026-10-25-isolated-environments.md).


- **Przepięcie domeny — plan i Faza 0 (2026-10-25).**
  [Plan](DOMAIN_CUTOVER_PLAN.md): `salon-bw.pl` = produkcja,
  `dev.salon-bw.pl` = development, panel/API bez zmian, bez zmian DNS.
  W kodzie: `www.` i 53 stare adresy PHP → 301, linki panelu do landingu
  z `NEXT_PUBLIC_LANDING_URL`. Owner zatwierdził pełne wdrożenie środowisk;
  resolver i izolacja dev wdrożone w PR #1516; końcowe runy są zapisane
  w [journalu środowisk](journal/2026-10-25-isolated-environments.md).
  [Plan Fazy 0](journal/2026-10-25-cutover-faza-0.md).
- **Spójność godzin landingu (2026-10-25, PR #1514 scalony).** Widok i
  JSON-LD korzystają z grafiku API; zamknięty tydzień oraz otwarta niedziela
  nie są zastępowane stałymi godzinami. CTA nie obiecuje „09–19 w tygodniu”,
  najbliższy termin ma Europe/Warsaw. Na izolowanej gałęzi od origin/master:
  baseline 70/70, poprawka 79/79. Scalono `db00569e`, Deploy `40216950888` success;
  cutover wykonany w zadaniu izolacji środowisk.
  [Journal](journal/2026-10-25-landing-schedule-consistency.md).

- **Automatyczne odświeżanie tokenu Instagrama (2026-10-24).** Workflow
  `ops_instagram_token_refresh.yml` co niedzielę 01:30 UTC odświeża token
  (`safe-update-instagram-token.sh --refresh`), restartuje aplikacje
  i sprawdza `/healthz`. Pierwszy przebieg 2026-11-01 — sprawdzić log.
  [Journal](journal/2026-10-24-instagram-token-auto-refresh.md).
- **Token Instagrama odnowiony (2026-10-24).** `/healthz`: instagram `ok`
  (było `oauthexception_190`). Ważny ok. 60 dni — odświeżyć przed
  **2026-12-23**. Ścieżka w panelu Meta i procedura w
  [journalu](journal/2026-10-24-instagram-token-rotacja.md).
- **Bramka audytu odblokowana (2026-10-24).** CI było czerwone od 2 pushów
  przez 3 nowe advisory „high”. body-parser → 1.20.9, multer → 2.5.0
  (workspace + package.json backendu); zod (CVE-2023-54404, tylko przez jimp,
  brak poprawki w 3.x) jako udokumentowany wyjątek zatwierdzony przez ownera.
  Audit high = 0. Znaleziony przy okazji błąd zmiany czasu w slotach (niedziela,
  znikomy wpływ) — w follow-upie.
  [Journal](journal/2026-10-24-audit-body-parser-multer-zod.md).
- **Brand skill dla Codexa (2026-10-24).** `.agents/skills/salonbw-brand` to
  symlink do `.claude/skills/salonbw-brand` — jedno źródło systemu designu
  dla Claude Code i Codexa. Stary worktree `synthetic-schedule-alignment`
  czeka na usunięcie przez ownera.
  [Journal](journal/2026-10-24-brand-skill-dla-codex.md).
- **Plan UAT opisuje realne dane (2026-10-24).** Ponowny plan importu Booksy
  na produkcji (bez zapisu) potwierdził: wszystko już zaimportowane, 0 do
  utworzenia, 0 konfliktów; eksport usunięty z serwera. `docs/UAT_PLAN.md` §0
  mówi teraz, że klientki i wizyty są realne (magazyn syntetyczny), i podaje
  zasady: zapisy tylko na koncie testowym lub kartach „UAT …”, prawdziwe karty
  tylko do porównania z Booksy. Finalny import przyszłych rezerwacji — bez
  `IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS`.
  [Journal](journal/2026-10-24-uat-plan-realne-dane.md).
- **Produkcja gotowa do UAT (2026-10-23).** Commit `749ed82d` przeszedł CI
  `39996678194` i Deploy `39996678153`. Po imporcie odtworzono techniczne
  konta admina i klienta, zsynchronizowano sekrety E2E bez ujawniania wartości,
  a produkcyjny Playwright Regression `39998664590` przeszedł 23/23. Live API
  potwierdziło filtr `emailConsent=false`, wyszukiwanie po e-mailu oraz osobne
  `lastPerformedAt` dla usług klientki. Skrypt rotacji admina unieważnia teraz
  sesje i usuwa blokadę logowania razem ze zmianą hasła.
  [Journal](journal/2026-10-23-uat-readiness-after-booksy-import.md).
- **Import Booksy zapisany na produkcji (2026-10-23).** Przed zapisem
  `pg_dump` do `~/db-backups/pre-booksy-import-20261023-172109.dump`. Dodane:
  1047 klientek, 10 109 wizyt, 144 opinie i 37 nieaktywnych usług
  historycznych, 0 konfliktów; ponowny plan nie ma nic do utworzenia. Hasła
  21 wcześniejszych kont klientek zresetowane (decyzja ownera), w tym konta
  testowego CI. Pliki eksportu usunięte z serwera.
  [Journal](journal/2026-10-23-import-booksy-klientek-i-wizyt.md).
- **Stary zrzut SQL z Versum (lipiec 2025) zostaje bez importu** (decyzja
  ownera). 783 z 1095 wizyt jest już na produkcji z Booksy, reszta to
  przełożenia, wizyty bez klientki albo dane bez kontaktów i dat.
  [Journal](journal/2026-10-23-decyzja-stary-zrzut-versum-bez-importu.md).
- **Przegląd panelu po imporcie i 3 poprawki** (branch
  `claude/customer-filters-email-search-last-done`): filtry „Brak zgody
  email/SMS” zawsze zwracały 0 (`"false"` parsowane jako `true`),
  wyszukiwarka klientów nie przeszukiwała e-maili, a „ostatnio wykonano”
  w statystykach karty pokazywało przy każdej usłudze datę ostatniej wizyty.
  [Journal](journal/2026-10-23-filtry-wyszukiwanie-ostatnio-wykonano.md).
- Zrealizowane Fazy 1.1, 1.2 i 2 z `LANDING_DESIGN_PLAN.md` (przed sesją
  zdjęciową — plan przewiduje, że tę część można zrobić wcześniej). Jedna
  klasa `.brand-photo`/`.brand-photo--soft` (`grayscale(1) contrast(1.06)`)
  zastosowana na każdym żywym zdjęciu landingu (hero, karta usług, galeria
  desktop+mobile, pasmo CTA, portret założycielki, strona `/gallery`,
  lightbox) — nic nie renderuje się już w kolorze. Naprawiony konkretny bug z
  planu: pasmo CTA miało diagonalny gradient najsłabszy dokładnie w centrum,
  za nagłówkiem, więc szyld salonu przebijał się przez tekst — zastąpiony
  jednolitym `--scrim-strong`. Dodane tokeny: 4-stopniowa skala tekstu na
  ciemnym tle, 3-wartościowa skala `letter-spacing`, `--state-error`
  (zastępuje `rgba(220,80,80,0.9)` liczone na 4,16:1 — poniżej progu AA —
  tokenem liczonym na 5,44:1). 23 pliki zmigrowane z surowych `#b4b8be`/
  `#0d0d0d`/`#ffffff`/`rgba(255,255,255,X)` na tokeny. Przy okazji: tekst
  14 px na mobile w `SectionHeader` (kaskaduje na 5 sekcji) i
  `HistoryAccordion` podniesiony do 16 px; sekcja kontaktu na stronie głównej
  miała jedyny inline `padding: 5rem` zamiast klasy rytmu sekcji reszty
  strony — ujednolicone. Landing 70/70, typecheck, lint i build PASS;
  wizualna weryfikacja zrzutami 1440/390 px na 5 trasach (z realnym
  przewijaniem — bez tego `loading="lazy"` i scroll-driven reveal dają
  fałszywie puste sekcje na zrzucie). [Journal
  2026-09-12](journal/2026-09-12-landing-design-tokens-phase-1-2.md).

- Powstał plan przebudowy landingu do poziomu „nietuzinkowy"
  ([LANDING_DESIGN_PLAN.md](LANDING_DESIGN_PLAN.md)) po przeglądzie renderu
  sekcja po sekcji na 1440 i 390 px. Diagnoza: szkielet edytorski jest dobry,
  blokerem jest fotografia dokumentacyjna pustego salonu w kolorze — galeria
  pokazuje osiem kadrów mebli i ani jednego efektu pracy. Plan dzieli robotę na
  brief sesji zdjęciowej (owner: co fotografować, formaty wymuszone przez
  layout, postprodukcja monochromatyczna) i pięć faz w kodzie: warstwa obrazu
  i pipeline, dyscyplina tokenów i typografii, sygnatura wizualna zamiast
  powtarzanej kreski pod nagłówkiem, rytm sekcji, porządki. Zmierzony stan
  wyjściowy: 4,81 MB obrazów na telefonie po pełnym przewinięciu (13 plików,
  największy 1703 kB), 64 surowe `#b4b8be` zamiast tokenu, 6 wartości
  trackingu, tekst 14 px na mobile, portret założycielki 270x370 px.

- Ponowny przegląd landingu zamknięty trzema poprawkami. Dane strukturalne
  (`HairSalon`, godziny, oceny, schematy usług) szły dotąd przez
  `<Script strategy="afterInteractive">`, więc `curl` po ośmiu adresach
  znajdował 0 wystąpień `application/ld+json` — teraz są renderowane w
  `<Head>` na serwerze, 1 na każdej sprawdzonej trasie, JSON poprawny.
  Cennik pokazywał „15 usługi": doszedł pluralizer z regułą słowiańską
  (12–14 włącznie), jest „15 usług". Przycisk „Umów" w wierszu cennika miał
  64x26 px i powtarza się 27 razy — ma 72x44 px. Tło karty na stronie głównej
  zamienione na wariant 1100 px: obrazy strony głównej na 390 px z 2,41 MB do
  0,84 MB. Landing 70/70, typecheck, lint i build PASS.
  [Journal 2026-09-11](journal/2026-09-11-landing-schema-plural-cta.md).

- Indeksowanie landingu zależy teraz od hosta, który obsłużył żądanie, a nie od
  statycznego `robots.txt`. Kopia serwowana z `dev.` (a po cutoverze — ze
  środowiska deweloperskiego) zwraca `Disallow: /` i `X-Robots-Tag: noindex`,
  host kanoniczny `Allow: /` wraz z sitemapą; brak hosta domyka się w stronę
  „nie indeksuj". `deploy.yml` ustawia jawnie `NEXT_PUBLIC_SITE_URL`, więc
  kanonikale nie zależą już od fallbacku w kodzie. Powód: sitemapa na dev
  ogłasza 10 URL-i na `salon-bw.pl`, z których 9 zwraca dziś 404. Landing
  64/64, nowe testy robots 8/8, eslint, typecheck, build i skrypty ops-guard
  PASS; weryfikacja przez nagłówek `Host` na zbudowanym artefakcie.
  [Journal 2026-09-11](journal/2026-09-11-landing-host-scoped-indexing.md).

- Odblokowano bramkę PostgreSQL w CI. Po `d2d4ff18` CI `34573029409` padało w
  jobie „Backend API": `beforeAll` obu specyfikacji PostgreSQL dostawał domyślne
  5 000 ms, a robi `dropSchema` razem z pełnym przebiegiem migracji, więc na
  wolniejszym runnerze hook przekraczał limit i zrywał połączenie w trakcie
  migracji. To nie była awaria importu ani migracji. `test/jest-e2e.json` ma
  teraz `testTimeout`, a oba hooki jawny limit. Fail-first odtworzył sygnaturę
  z CI, po poprawce PostgreSQL 14/14, backend 414/414, typecheck, lint i
  Prettier zmienionych plików PASS. Deploy `34573029371` zatrzymał się na
  bramce F6 poprawnie, więc czerwony `d2d4ff18` nie trafił wtedy na produkcję.
  Zmergowane jako `04956d1c` (PR #1500, squash): CI `34628511807` i Deploy
  `34628511811` success, a bramka F6 realnie czekała na CI tego SHA od 17:35:36
  do 17:40:44 UTC. Ten rollout wyniósł na produkcję również F3/F8.
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

**Administrator systemu — 2026-10-25:** owner potwierdził osobny pulpit
techniczny i wyłączenie konta z personelu/rezerwacji przy zachowaniu pełnej
roli admin. Kod, migracja domyślnie false i prywatny endpoint /system/status
wdrożono w `ad41ae49` po akceptacji ownera: CI `40212869107`, Deploy
`40212869116` success. Flaga przypisana celowanemu kontu, sesje unieważnione,
bez zmiany hasła. Live status: 200 technical / 403 salon-admin i client /
401 anonimowo; konto nie jest personelem. Regresja `40213894642` success.
Następny krok: owner wykonuje biznesowe UAT na obu działających środowiskach
i potwierdza dostarczenie powiadomienia na własny wskazany adres. Wdrożenie,
kontrola wersji i regresja `40291708798` (23/23) zakończone.
[Journal i dowody](journal/2026-10-25-system-administrator-dashboard.md),
[projekt](plans/2026-10-25-system-admin-dashboard.md).

> **Historia przestoju (nie bieżący stan):** diagnoza okresu 12.09–22.10:
> [journal](journal/2026-10-22-weryfikacja-po-przestoju.md).

**✅ Dzień pracy salonu przeszedł test akceptacyjny w przeglądarce
(2026-10-23).** Cały cykl — rejestracja, rezerwacja online z dodatkiem,
alert do salonu, potwierdzenie, wiadomości, przełożenie i akceptacja,
finalizacja z rabatem/sprzedażą/materiałem/recepturą/napiwkiem, magazyn,
historia i przygotowanie kolejnej wizyty, anulowanie, zapis telefoniczny,
no-show, klientka z importu, rezerwacja z telefonu, statystyki — na lokalnym
stosie wiernym produkcji. Znaleziono i naprawiono **11 błędów** (każdy z testem
i weryfikacją w przeglądarce), m.in.: brak tabel logowania w łańcuchu migracji,
szczegóły wizyty gubiące uwagi i dodatki, skracanie wizyty przy przełożeniu,
podwójne liczenie wydatków, brak powiadomienia salonu o odwołaniu, jawne hasła
klientek zakładanych przez salon, ślepy zaułek przy rejestracji klientki
z importu. Szczegóły i zakres tego, czego test nie dowodzi:
[journal](journal/2026-10-23-test-akceptacyjny-dnia-pracy-salonu.md).

Poprawki wdrożone: PR #1509 → `54adc5d`, deploy `39922258629` success
(2026-10-23 08:15 UTC).

**Bezpieczeństwo:** zamknięte 2026-10-22 (#1508, `9816b4f`, deploy success):
`pnpm audit` 0 nieuwzględnionych high/critical, Next 15.5.28 na produkcji.
Przyczyna systemowa otwarta: dependabot podnosi `package.json` bez
`pnpm-lock.yaml`, dlatego jego PR-y nie przechodzą CI.

**Import z Booksy: zapisany na produkcji 2026-10-23.** Eksport zawierał całą
historię, także z Versum (2017–2027). W bazie jest teraz 1068 klientek
i 10 179 wizyt; liczby i kontrole spójności są w
[journalu](journal/2026-10-23-import-booksy-klientek-i-wizyt.md). Przyszłe
rezerwacje (91) nie zostały zaimportowane i wejdą w finalnym imporcie
z `IMPORT_BOOKSY_INCLUDE_FUTURE=1` na świeżym eksporcie przy przejściu z Booksy.

Review 2026-09-10 wykazało dalsze ryzyka wiarygodności widoku i importu. F1/F4,
F2, F5/F7 i F6 są wdrożone; F3/F8 mają techniczną bramkę sprawdzoną na
izolowanym PostgreSQL i oczekują na rollout kodu oraz plan rzeczywistych danych.
Szczegóły i kryteria odbioru są w review.

**Stan wydania:** produkcja stoi na `749ed82d`; API i panel zawierają import
Booksy oraz poprawki filtrów, wyszukiwania i dat usług. CI i Deploy dla tego
SHA są zielone, a pełna regresja po zalogowaniu przeszła na produkcji.

**Następny krok:** owner wykonuje UAT na realnym sposobie pracy: logowanie,
kalendarz dnia, karta klientki i historia farbowania, rezerwacja klientki oraz
obsługa rozmowy. Po akceptacji: świeży eksport Booksy, finalny import 91
przyszłych rezerwacji z `IMPORT_BOOKSY_INCLUDE_FUTURE=1`, miękki start i
hypercare. Instagram pozostaje osobnym blokerem galerii landingu.

## Fakty zweryfikowane

- 2026-10-26: sześć aplikacji na `328d362f`; prod database/smtp/instagram ok,
  dev database ok i dostawcy wiadomości pominięci. Godziny home/contact zgodne
  z API, 60 cen/czasów usług zgodnych, trzy legal routes 200, www 301.
  Techniczny pulpit i logowanie dev: 1440/390 px, zero błędów/overflow.
  Plugin MyDevil 0.3.0: natywnie 17 narzędzi, 150 operacji, 84 testy lokalne.
  Końcowa regresja produkcyjna `40291708798` success: 23/23, bez pominięć.

- 2026-10-23 po deployu `749ed82d`: CI `39996678194`, Deploy
  `39996678153` i Playwright Regression `39998664590` success; 23/23 testów
  produkcyjnych po zalogowaniu przeszło dla roli admina i klienta. Konta
  techniczne zostały zrotowane, stare sesje unieważnione, a wartości zapisano
  wyłącznie w macOS Keychain i GitHub Secrets.
- 2026-10-23 live API po zalogowaniu admina: 1068 klientek; podział
  `emailConsent=false/true` = 1068/0, wyszukiwanie dokładnego e-maila zwróciło
  właściwą kartę, a 5 ulubionych usług miało 5 różnych `lastPerformedAt` i 0
  braków. Nie wypisano danych osobowych ani sekretów.
- 2026-10-23 lokalnie (kopia lokalnej bazy testowej, eksport Booksy ownera
  poza repo): plan i zapis `import:booksy` — 1048 kart (w tym zbiorcza),
  13 461 wizyt, 77 usług historycznych, 0 konfliktów, 73 s; ponowny plan:
  wszystko „already imported”, 0 do utworzenia. Potem przebieg zgodny
  z decyzjami ownera: 1047 klientek, 10 109 wizyt, 144 opinie. Testy reguł
  19/19.

- 2026-10-23 ~08:16 UTC po deployu #1509 (`54adc5d`): `api/healthz` 200,
  `database`/`smtp` ok, `instagram` error (token); panel 307, `/auth/register`
  i `/auth/forgot-password` 200, landing dev 200.
- 2026-10-23 lokalnie (stos wierny produkcji: schemat wyłącznie z migracji,
  backend instalowany jak w deployu — Express 5.2.1, panel `next build`/`start`,
  strefa `Europe/Warsaw`): pełny dzień pracy salonu przechodzi w Chromium
  (desktop 1366 i telefon 390×844). Testy: backend 421/421, panel 404/404.
  Wyłącznie dane syntetyczne; produkcja i dane klientek nietknięte.
- 2026-10-22 23:00: po deployu #1508 `api/healthz` 200, `database`/`smtp` ok,
  `instagram` error (wygasły token — po stronie ownera); landing serwuje
  Next 15.5.28.
- 2026-10-22 21:51 (master `36dbccd`, bez nowego wdrożenia): `api/healthz` 200 —
  `database` ok (18 ms), `smtp` ok (110 ms), ale **`instagram` error**
  (`instagram_http_400_oauthexception_190_0`, dwa pomiary, więc trwałe).
  `dev.salon-bw.pl/gallery` 200, lecz **zero mediów z Instagrama** i komunikat
  „Galeria Instagram jest chwilowo niedostępna" — galeria jest pusta dla
  odwiedzających. Panel 307 bez sesji, landing dev 200. `salon-bw.pl` 301 → `www`
  i **nadal stary PHP 8.1.34** (zero `_next`), więc cutover landingu nie
  nastąpił. Ostatni `Deploy (MyDevil)` na masterze: `34712638623` success,
  2026-09-12. Nie użyto kont ani danych klientek, nie wykonano zapisu.
- 2026-10-22 lokalnie: `pnpm audit --audit-level=high` → 4 low, 29 moderate,
  **24 high, 6 critical**. `#1506` i `#1507` nie zawierają `pnpm-lock.yaml`;
  `next: 15.5.24` potwierdzone w `overrides` w `pnpm-workspace.yaml`, a lockfile
  zapisuje dla `apps/landing` `specifier: 15.5.24` — stąd zielone CI na zmianie,
  która nic nie zmienia. Node bez przeszkód dla nodemailera 10: `engines >=22`,
  `.nvmrc` 22, CI 22, host `node22`.
- 2026-09-11 20:02 po wdrożeniu `fb138b1c` (Deploy `34639685597` success):
  `https://dev.salon-bw.pl/robots.txt` zwraca `User-agent: *` i `Disallow: /`
  bez linii `Sitemap`; `/` oraz `/services` odpowiadają 200 z nagłówkiem
  `X-Robots-Tag: noindex, nofollow`, a kanonikal w HTML to nadal
  `https://salon-bw.pl/`. Kopia na `dev.` jest więc wyłączona z indeksowania,
  a strona działa bez zmian. Nie użyto kont ani danych klientek.
- 2026-09-11 18:09 po wdrożeniu `04956d1c`: `api/healthz` 200 z `database`,
  `smtp` i `instagram` `ok`; panel 307 bez sesji, landing dev 200. Deploy
  `34628511811` przeszedł komplet kroków backendu: bramka CI, build, upload,
  migracje, restart i smoke test. Nie użyto kont ani danych klientek i nie
  wykonano zapisu.
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

- **Hasła klientek — decyzja wykonana 2026-10-23:** import zresetował hasła
  wszystkich importowanych kart. Klientki odzyskują dostęp przez e-mailowy
  reset hasła; przed miękkim startem owner sprawdza rzeczywiste dostarczenie
  jednej wiadomości na wskazany własny adres.
- **Restore-drill — pominięty decyzją ownera 2026-10-23** (polega na
  automatycznych kopiach MyDevil). Nie traktować jako blokera.
- **Test dostarczenia alertu o rezerwacji** — owner wykona sam, później.
- **Strefa czasowa produkcji:** godziny wiadomości są poprawne tylko, gdy
  Postgres i API mają tę samą strefę — potwierdzić na nowej wiadomości.
- Miękki start i udostępnienie klientkom oraz finalny import przyszłych wizyt
  nadal wymagają odrębnej decyzji. Przełączenie landingu zatwierdzono i wykonano
  2026-10-25: `salon-bw.pl` jest produkcją, `dev.` pozostaje developmentem.
  `/policy`, `/privacy` i `/data-deletion` odpowiadają 200 na domenie głównej;
  kanoniczne ustawienia Meta zapisano i odczytano ponownie.
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
- **Instagram — awaria z 2026-10-22 usunięta 2026-10-24.** Health przy cutoverze
  potwierdził `instagram: ok`; cotygodniowy workflow odświeżania wdrożony.
  Pierwszy zaplanowany przebieg 2026-11-01 wymaga kontroli wyniku. Procedura
  awaryjna pozostaje w journalu rotacji i `docs/ENV.md`.
- Historyczny cleanup/dataset z 2026-08-06 nie jest dowodem aktualnej czystości
  bazy. Nie czytano i nie modyfikowano dziś danych klientów.
- Pozostałe decyzje: przegląd prawny, dane firmy, kategorie produktów,
  trwałość uploads — szczegóły i historyczne decyzje w planie/journalach.
