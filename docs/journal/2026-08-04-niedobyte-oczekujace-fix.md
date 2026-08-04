# Fix: przeterminowane rezerwacje oczekujące niewidoczne + flaga „niedobyta"

- **Data:** 2026-08-04
- **Agent:** Claude (zgłoszenie live od właściciela)
- **Commit:** `b4249b81`
- **PR:** brak (bezpośredni push na `master`)

## Finding

Właściciel zgłosił: „Po wejściu na panel pokazują się np 4 rezerwację
online czekające na potwierdzenie - po kliknięciu zarządzaj lista jest
pusta".

Zdiagnozowane live przez bezpośrednie wywołania API z panelu: badge
topbara (`/appointments/online-pending-count`) poprawnie zwracał
`{"count":4}` (bez filtra dat — liczy WSZYSTKIE `online_pending`,
niezależnie od terminu). Strona `/appointments?status=online_pending`
zwracała pustą listę, bo filtr statusu `online_pending`/
`rescheduled_pending` domyślnie zawężał okno dat wyłącznie w PRZÓD
(`dziś..+90d`) — założenie kodu (komentarz: „PENDING bookings (which
are in the FUTURE)") było błędne. Rezerwacja, której `startTime` już
minął, a nikt jej nie potwierdził ani nie odrzucił, wypadała z okna,
mimo że wciąż liczyła się do badge'a.

Właściciel doprecyzował oczekiwane zachowanie (nie tylko „napraw
widoczność"): taka przeterminowana rezerwacja oczekująca nie powinna
wyglądać jak zwykła pozycja na liście — klientka mogła odwołać
telefonicznie lub osobiście bez aktualizacji systemu, więc Ola musi
mieć jasny sygnał „to wymaga Twojej decyzji", nie tylko szerszy filtr
dat.

## Change

`apps/panel/src/pages/appointments.tsx`:

1. **`resolvePendingStatusDateWindow(status, today)`** (czysta,
   eksportowana funkcja) — okno dat dla statusów
   `online_pending`/`rescheduled_pending` rozszerzone do
   `dziś-90d..dziś+90d` (było: tylko w przód).
2. **`isOverduePending(appt, now)`** (czysta, eksportowana funkcja) —
   `true` gdy status to `online_pending`/`rescheduled_pending` ORAZ
   `startTime` już minął.
3. Wiersze z `isOverduePending===true` dostają:
   - podświetlenie `table-danger`,
   - nadpisaną etykietę statusu „Niedobyta — do potwierdzenia"
     (zamiast zwykłego „Oczekuje"),
   - podpowiedź pod statusem: „Termin minął bez potwierdzenia —
     sprawdź, czy klientka nie odwołała telefonicznie lub osobiście.",
   - przyciski „✓ Potwierdź" / „✕" z tooltipami dopasowanymi do
     kontekstu (potwierdź = wizyta się jednak odbyła/klientka
     potwierdziła; odrzuć = klientka odwołała lub nic się nie
     wydarzyło).
4. Przyciski akcji (Potwierdź/Odrzuć) rozszerzone z samego
   `online_pending` również na `rescheduled_pending` — oba przejścia
   (`confirmed`, `cancelled` przez istniejący endpoint `/cancel`) są
   już wspierane przez backend (`appointments.service.ts` allowed
   transitions), tylko UI ich nie pokazywał.

Nie dodano nowego statusu backendowego — „niedobyta" to stan
POCHODNY (status + upływ czasu), liczony w locie; unika się migracji i
rozszerzania macierzy przejść statusów o nowy stan.

## Validation

- Nowe testy: `apps/panel/src/__tests__/appointmentsPageDateWindow.test.ts`
  — 4 dla `resolvePendingStatusDateWindow` + 4 dla `isOverduePending`
  (w tym regresja na dokładnym przypadku z live — appointment ze
  `startTime` 2026-07-30 wciąż `online_pending`).
- Rytuał fail-first: `git stash` na `appointments.tsx` (test NIE
  stashowany) → 8/8 RED z dokładnym `TypeError: ... is not a function`
  → `git stash pop` → 8/8 GREEN.
- Panel: `pnpm test` 364/364 (było 360, +4 — pełny przyrost to +4 bo
  data-window miał już 4 testy z poprzedniej, nieukończonej sesji),
  `tsc --noEmit` czysty, `eslint --fix` bez błędów.
- CI: zielone.
- Deploy: push-deploy automatyczny, run zakończony `success`.
- **Live:** zalogowany jako admin (`kontakt@salon-bw.pl`),
  `/appointments?status=online_pending` pokazuje teraz **4 wizyty**
  (zgodnie z badge'em, było: 0/pusta lista). Każda oznaczona „Niedobyta
  — do potwierdzenia" z podpowiedzią + przyciskami Potwierdź/✕.
  Wszystkie 4 to pozostałości testowe z wcześniejszych sesji UAT
  (klienci „SYNTHETIC Klient 03/07/11" + „UAT Klientka Testowa",
  daty 30-31.07 i 01.08.2026) — nie realne rezerwacje klientek, ale
  reprezentatywne dla scenariusza, który zgłosił właściciel.

## Rollout

Na `master`, wdrożone na produkcję. Deploy code: `b4249b81`.

## Follow-up

- **Dane testowe do sprzątnięcia:** 4 rezerwacje z UAT (`SYNTHETIC
  Klient 03/07/11`, `UAT Klientka Testowa`, appointmenty przy
  klientach 87/91/95/97) wciąż wiszą jako `online_pending` na
  produkcji — do usunięcia migracją FK-safe (wzorzec z wcześniejszych
  sesji) przy najbliższej okazji porządków, żeby panel administratorki
  nie pokazywał czterech fałszywych „niedobytych" wizyt.
- Rozważyć w przyszłości: czy podobne oznaczenie „wymaga potwierdzenia"
  przydałoby się też na widoku kalendarza (obecnie fix dotyczy tylko
  listy `/appointments`), skoro to główne miejsce pracy Oli na co
  dzień.
