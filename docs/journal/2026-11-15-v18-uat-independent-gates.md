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
