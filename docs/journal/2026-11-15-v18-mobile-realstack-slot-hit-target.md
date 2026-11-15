# Studio V18 — mobile real-stack QA: kliknięcie w warstwowy time-grid

- **Data:** 2026-11-15
- **Typ:** TYPE B / CRM / PRELAUNCH
- **PR:** #1705 (Draft)
- **Badany SHA właściciela:** `acc933c022579183652a2f3afc2ba9094f091bed`
- **Agent:** ChatGPT
- **Zakres zmiany:** wyłącznie test Playwright; bez zmian runtime, API, danych i cache

## Finding

Trzeci faktyczny przebieg lokalnego izolowanego UAT na Mac mini uruchomił
Node preflight, Docker/Next/Nest, syntetyczny PostgreSQL i migracje/seed.
W `apps/panel/tests/visual/studio-v18-owner-real-stack.spec.ts:222`
`await timedSlot.click()` po 30 s timeout, ponieważ locator wskazuje
`.fc-timegrid-slot-lane[data-time="10:15:00"]`, ale na tej pozycji
FullCalendar renderuje nakładający się `.fc-non-business`.
Playwright słusznie odmawia kliknięcia przykrytego `td`. Jest to dowód
niewłaściwego wyboru **DOM targetu testu**, nie wystarczający dowód
niedziałającego UI i nie dowód błędu backendu.

`targetDate` jest wyliczany jako +28 dni od bieżącej daty w Warszawie:
z niedzieli 2026-11-15 prowadzi do niedzieli 2026-12-13; brak
grafiku/hours dla dnia może powodować zacienienie. Manualne dodanie wizyty
poza grafikiem pozostaje uprawnionym scenariuszem właścicielki; test nie
może omijać widocznej warstwy przez `force: true`.

## Rzeczywisty wynik operatora 2026-11-15

- Host Node `v26.13.0`: source-contract preflight **7/7 PASS**.
- Docker image build **16/16 PASS (cache)**; prywatna sieć Compose, PostgreSQL
  **16.16 HEALTHY**, aplikacje i zależności uruchomione w odizolowanym środowisku.
- Kontenery: Node contract **7/7 PASS**.
- Jest environment isolation **5/5 PASS**; Jest appointmentMove **10/10 PASS**.
- Backend + panel TypeScript `--noEmit` **PASS**.
- Negatywny seed na bazie ze znacznikiem: **odmowa PASS**, zachowanie
  znacznika i nienaruszonego katalogu **PASS**.
- Seed/migracje do pustej bazy syntetycznej **PASS**.
- NestJS `healthz` **PASS**; API `/employees` zwróciło dokładnie
  jedną operatorkę `Aleksandra`.
- Mobilny Chromium 390 px: **1 FAIL** na kliknięciu slotu, reszta tego
  scenariusza nieuruchomiona.
- Desktop DnD i niezależna weryfikacja końcowej bazy **NIEURUCHOMIONE**
  ze względu na fail-fast; nie nadawać im PASS.
- Docker kontenery zostały zatrzymane; brak deploymentu/merge i zmian MyDevil.

## Change

- `studio-v18-owner-real-stack.spec.ts` zamiast
  `timedSlot.click()` wykonuje `scrollIntoViewIfNeeded()`,
  sprawdza `boundingBox()` i wywołuje **prawdziwy**
  `page.mouse.click(x, y)` w środku komórki. Browser stosuje normalny
  hit-testing do widocznej warstwy FullCalendar (bez `force:true`).
- Po wpisaniu daty test sprawdza, że URL rzeczywiście ma
  `date=targetDate` przed interakcją z siatką, aby od razu wychwycić
  ewentualną niespójność daty.

Nie zmieniono `CalendarView`, reguł konfliktów, godzin pracy,
rol użytkownika, bazy, polityki `staleTime` ani produkcji.

## Validation

- Rzeczywisty log **sprzed poprawki** jest dowodem punktów PASS/FAIL.
- Kod testu i hash zmian zweryfikowano w GitHub dla aktualnej gałęzi.
- **Nie wykonano jeszcze** poprawionego Playwright na dokładnym SHA.
  Wniosek o naprawie pozostaje hipotezą do sprawdzenia w przeglądarce;
  samo code review nie pozwala zmienić wyniku testu na PASS.

## Rollout

Nie dotyczy. PR #1705 pozostaje Draft. DEV/PROD nie wdrożono.

## Follow-up

Uruchomić ponownie istniejący runner `scripts/qa/v18-docker/run-from-mac.sh`
na aktualnym HEAD w odłączonym worktree. Po przebiegu:
- potwierdzić `V18_LOCAL_DOCKER_FAST_PREFLIGHT=PASS`,
  `V18_DOCKER_NEGATIVE_SEED=PASS`, `V18_DOCKER_NEST_HEALTH=PASS`;
- sprawdzić przejście mobilnego tworzenia, przesuwania i anulowania wizyty,
  jej stan w PostgreSQL oraz desktop DnD;
- w razie kolejnego FAIL naprawiać konkretny krok bez obniżania izolacji;
- osobno zostawić #1706 PostgreSQL `PUBLIC CONNECT` dla operatora.
