# Studio V18 — odwracanie niepoprawnego przeciągnięcia wizyty

- **Data:** 2026-11-14
- **PR:** #1705 — Draft
- **Zmiana:** CalendarView i walidacja zdarzeń drag/resize
- **Bez zmian:** API, migracje, cache React Query, reguły konfliktów i dane środowisk

## Finding

W `apps/panel/src/components/calendar/CalendarView.tsx` funkcje
`handleEventDrop` i `handleEventResize` odczytywały identyfikator przez
`parseInt(info.event.id.split('-')[1], 10)` bez sprawdzenia poprawności.
W razie `start=null` lub `end=null` wykonywały po prostu `return`.
FullCalendar wcześniej optymistycznie przemieszcza zdarzenie, więc brak
`info.revert()` pozwalał pozostawić na ekranie niezapisaną zmianę.
Przypadek jest szczególnie istotny przy niekompletnych zdarzeniach
all-day/month, błędnym ID lub przyszłej regresji adaptera FullCalendar.

## Change

- `src/utils/calendarAppointmentMove.ts` — czysta walidacja: dopuszcza
  tylko `appointment-<dodatnie bezpieczne ID>`, wymaga dwóch poprawnych
  dat, `end > start`.
- `CalendarView.tsx` — wspólna walidacja przed `onEventDrop`.
  Zarówno `eventDrop`, jak i `eventResize` bezwarunkowo wykonują
  `info.revert()`, gdy walidacja odrzuci ruch.
- `src/__tests__/calendarAppointmentMove.test.ts` — test prawidłowego
  przeniesienia, obcych/zepsutych ID, brakujących dat, NaN i przedziału
  `end <= start`.
- `scripts/qa/v18-docker/run.sh` — test dołączony do pakietu lokalnego QA.

Nie zmieniono zachowania poprawnych operacji. Zapisy nadal przechodzą przez
istniejący endpoint, transakcje i walidację konfliktów.

## Validation

- Pobrano plik helpera z GitHub i potwierdzono hash `git hash-object`
  **`1f5de777d54b867d4de1d7d84f7d7cae217ac228`** zgodny z lokalną
  kopią wykonaną w środowisku Node 22.16.0.
- Node `--experimental-strip-types --test`: **14/14 PASS**, 0 FAIL,
  0 SKIP. Test obejmował prawidłowy ruch, 7 niepoprawnych identyfikatorów,
  2 brakujące daty i 4 nieprawidłowe przedziały.
- Potwierdzono przez pobranie aktualnego kodu, że obie ścieżki
  `CalendarView` wywołują `info.revert()` dla niepoprawnego ruchu.
- **Nie uruchomiono** pełnego Jest komponentu, typecheck/build panelu ani
  Playwright na końcowym SHA. Nie było testu live stack, wdrożenia,
  autoryzacji PROD ani zmian danych klientów.

## Rollout

Bez merge/deploy/restartów. PR nadal **Draft**.
Dostęp do produkcyjnych rekordów i tożsamości nie był używany.

## Follow-up

1. Uruchomić exact-SHA `pnpm --dir apps/panel exec jest --runInBand src/__tests__/calendarAppointmentMove.test.ts`
   i `pnpm --dir apps/panel exec tsc --noEmit`, następnie build.
2. Uruchomić przygotowany izolowany Docker real-stack UAT z desktop drag/drop
   i mobile owner flow; naprawić ewentualny FAIL przed DEV UAT.
3. Zachować ograniczenia PROD i rozwiązać rzeczywistą izolację DB #1706;
   nie wykonywać niezatwierdzonej zmiany ACL.
