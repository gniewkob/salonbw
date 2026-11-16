# Studio V18 — zamiast kolejnych drobnych poprawek testu: niezależne bramki UAT

- Data: 2026-11-15
- Projekt: SalonBW, TYPE B / CRM / PRELAUNCH
- PR: #1705 (Draft)
- Wykonany przez właściciela SHA: `9a4b43853d4b49a715cfe1b88d2a35b09f199d01`
- Zakres tej zmiany: dwa testy QA i jeden runner; **bez zmian kodu runtime, API, infrastruktury hostingu i PROD**.

## Dowód z rzeczywistego testu (SHA 9a4b43853)

- Mac node preflight **9/9 PASS**.
- Docker build Next/Nest/Chromium **PASS**, PostgreSQL 16.16 HEALTHY.
- Node contracts **9/9 PASS**, Nest isolation Jest **5/5 PASS**, calendar move Jest **10/10 PASS**, backend/panel TypeScript **PASS**.
- Negatywny test seedowania niepustej bazy i zachowania markera **PASS**; migracje i pozytywny syntetyczny seed **PASS**, NestJS health **PASS**.
- Mobile Playwright: **1 FAIL** przed CRUD:
  `OWNER_SLOT_GEOMETRY=unexpected hit target`. Geometria na viewport 390×844:
  `slot-lane={x:26,width:999979,y:397.84375,height:48}`,
  `col={x:5,width:21,y:-34.15625,height:2112}`,
  wybrany punkt `x:15.5,y:421.84375` trafia w
  `SECTION.V18Calendar_mainPanel__TeHEs`, nie w FullCalendar.
- Te 21 px to **kolumna osi godzin**, błędnie wybrana przez selektor
  `.fc-timegrid-col` (first). Szerokość wiersza slat FullCalendar nie jest
  wiarygodnym obszarem kliknięcia. To tłumaczy powtarzane nietrafione próby.
  Sam log nie dowodzi, że produkcyjny handler `dateClick` jest wadliwy.
- Wcześniej monolityczny test zatrzymywał cały runner przed właściwym
  `create→reschedule→cancel`, DB verify i desktop DnD. To był problem
  projektu QA, nie dowód awarii każdego modułu.
- Po zakończonym biegu kontenery zostały zatrzymane. Brak merge i deployu.

## Wykonane poprawki

1. **Rozdzielenie scenariuszy:** test P0 użytkownika opiera się na realnym
   przycisku `Nowa wizyta`, wykonuje pełny CRUD/role/409/403; osobny
   `V18 mobile calendar slot opens manual drawer without saving` sprawdza
   tapnięcie w siatkę również w dzień niepracujący. Oba są obowiązkowe.
2. **Niezależność od wcześniejszego błędu:** `run.sh` uruchamia P0 owner,
   odczytowy PostgreSQL verify, mobile tap i desktop DnD **osobno**,
   zbiera wszystkie kody zakończenia i na końcu zwraca FAIL, jeżeli
   jakakolwiek obowiązkowa bramka jest czerwona. Jeden błąd gestu nie
   ukrywa już wyniku zapisu wizyty i desktopu.
3. **Poprawny wybór kolumny:** mobilny test wybiera
   `.fc-timegrid-col[data-date="<targetDate>"]`, nigdy kolumnę
   osi godzin, weryfikuje viewport i zwykłe `touchscreen.tap`.
   Żadnego `force:true` ani sztucznego event dispatch.
4. **Rzeczywisty wybór daty wizyty:** główny test wybiera przyszły
   dzień roboczy, datę przez V18 DatePicker oraz godzinę 11:00 przez
   V18 TimeSelector przed zapisem. Dotychczas używał domyślnego
   `now + 10 minutes`, a następnie szukał wizyty 28 dni później.
   Nowy test weryfikuje również, że wysłany `startTime` przypada
   na właściwą datę w `Europe/Warsaw`.
5. **Regresja source contract:** sprawdza dedykowany atrybut `data-date`
   i cztery niezależne bramki runnera.

## Wyniki walidacji tej zmiany

- Odczyt bieżącego kodu w repo GitHub i ocena zależności: kompletna.
  Graphify nie było udostępnione w bieżącym środowisku; kod repo
  pozostaje źródłem prawdy.
- Kontrole spójności źródła: wykonywane osobno; nie traktować jako E2E.
- **Brak** uruchomienia Node/Jest/Playwright/Docker na nowym SHA w sesji
  GitHub connector. Nie przypisywać poprzednich PASS obecnym zmianom.
- DEV/PROD bez zmian, produkcyjne rekordy nietknięte, brak ACL changes.

## Najbliższy krok i zasady odbioru

**Jeden** lokalny test na aktualnym HEAD PR #1705 w istniejącym Dockerze.
Raport musi zawierać niezależnie:
`V18_DOCKER_OWNER_BROWSER_CRUD`,
`V18_DOCKER_OWNER_DB_VERIFY`,
`V18_DOCKER_MOBILE_SLOT_TAP`,
`V18_DOCKER_DESKTOP_DND_AND_PERMISSIONS`, oraz końcowy status.
Jeżeli tylko manualny slot nie przejdzie, pozostałe trzy wyniki
pozostaną miarodajne. Nie obniżać obowiązkowości testów ani
nie uznawać ich automatycznie za PASS.

**Do DEV:** wyłącznie kontrolowany deploy po rzeczywistym pozytywnym
przebiegu na syntetycznych danych oraz potwierdzonej separacji od PROD.
**Do PROD:** osobne bramki izolacji i recovery. PostgreSQL ACL #1706,
business UAT #1531 pozostają otwarte.

## 15.11 — follow-up: review poprawności scenariusza i kosztu Docker

**Przegląd kodu:** `AppointmentDrawer` otrzymuje `visualVariant="v18"`
dla tworzenia **i edycji**, więc jego aria-label to zawsze
`Rezerwacja wizyty V18`, nigdy `Appointment`. Poprawiono tę
konkretną, nieaktualną asercję w scenariuszu real-stack przed nowym UAT.
Kontrolowano też rzeczywisty V18Select (custom combobox/listbox),
V18DateInput, V18TimeSelector, QuickModal i ConfirmModal. Ich role i
nazwy odpowiadają obecnym krokom testu.

**Usprawnienie czasu cyklu:** dotychczasowy Dockerfile kopiował wszystkie
pliki przed `pnpm install`, więc każda poprawka w teście unieważniała
cache pobierania zależności. Zmieniono kolejność na:
`COPY pnpm-lock.yaml pnpm-workspace.yaml` → `pnpm fetch` →
`COPY .` → `pnpm install --offline --frozen-lockfile`.
To izoluje cache pobranych paczek od zmian w źródłach bez modyfikowania
wersji Node 22, pnpm 10.14, lockfile czy reguł wykluczania sekretów.
Nowy source-contract weryfikuje tę kolejność oraz poprawiony selektor
okna edycji. Rozwiązanie bazuje na oficjalnej dokumentacji pnpm:
https://pnpm.io/docker.

**Evidence:** potwierdzono blob sources z GitHub i zgodność logiki testów.
Pełne `node --test`, Jest, typecheck, Docker/Chromium na nowym HEAD
**nie zostały wykonane** w obecnej sesji. Nie twierdzimy, że
`pnpm fetch` lub cztery bramki E2E są PASS bez rzeczywistego przebiegu.
Brak zmian runtime aplikacji i MyDevil, brak deploy, brak zmian w bazach.

## 15.11 — Mac Docker UAT: owner + SQL + mobile green, last desktop blocked by login throttle

**Exact SHA executed:** `001db2cbe044ecd629bf65de7912518f8f888d7e`.

- Host preflight and Docker contracts **11/11 PASS**; backend Jest **133/133 PASS**; panel Jest **32/32 PASS**; image build Nest/Next, typecheck, isolated PG16.16, negative no-data-loss seed, positive seed and Nest health **PASS**.
- Owner browser create→reschedule→cancel **PASS** including real API, 403 client-role / 409 conflict; PostgreSQL verifier **PASS** and final persisted status `cancelled`.
- Mobile slot tap **PASS** at a genuine `TD.fc-timegrid-slot-lane`, drawer opened, no writes.
- Desktop drag/permissions first **2/2 PASS**. Third responsive brand test failed login navigation; the login form stayed at `/auth/login`, without a recorded HTTP response status in supplied output. Backend `AuthController.login` explicitly has NestJS `@Throttle({default:{limit:5,ttl:60000}})`. In this isolated same-IP run the test suite performed six sequential UI logins (owner CRUD, client 403 probe, mobile owner, desktop owner, client, visual owner) within the rate window; the **sixth is consistent with the configured throttle**. No login security setting is changed.
- Remediation: the existing responsive visual test is now a `test.step` in the *first authenticated desktop owner test*, after cleanup of its synthetic visit. All four screenshots, all CSS checks and `V18_BRAND_DRAWER_DESKTOP_MOBILE=PASS` marker are preserved. Desktop client-role test remains separate. Entire UAT now performs five logins, respecting the existing limiter.
- A source safety regression verifies five UI sign-ins across the two Playwright files and presence of all visual evidence. Current GitHub source readback **14/14 PASS**. **No exact-new-SHA Docker/Playwright execution yet**; do not claim a green final brand check.
- **No merge, no DEV deployment, no change to PROD/ACL/real user accounts.**

Next: one exact-SHA Mac Docker run. Do not diagnose Compose exit 1 while its acceptance tests report FAIL. If all four gates pass, proceed with controlled synthetic DEV review deployment.
