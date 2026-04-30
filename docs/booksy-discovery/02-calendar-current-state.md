# 02 — Calendar Current State (Legacy vs Native)

## Jak działa dziś `/calendar`

1. Użytkownik otwiera `/calendar`.
2. `apps/panel/src/pages/calendar.tsx` renderuje pełnoekranowy `iframe`.
3. `iframe` ładuje `/api/calendar-embed`.
4. Endpoint serwuje przerobione HTML/JS runtime (vendored assets + runtime shims).

## Co robi `/api/calendar-embed`

- Ustawia global config:
  - `window.SalonBWConfig`
  - `window.VersumConfig = window.SalonBWConfig`
- Przepina assety:
  - `/versum-calendar/*` -> `/salonbw-calendar/*`
  - `/versum-vendor/*` -> `/salonbw-vendor/*`
- Interceptuje `fetch` i `XMLHttpRequest`:
  - dodaje `Authorization` dla endpointów compat,
  - przepina żądania widoków kalendarza na `/api/runtime/calendar-views/*`.

## Legacy endpointy obsługiwane dla runtime

- `GET /events` (+ alias `/salonblackandwhite/events`)
- `GET /events/:id/screen_data`
- `POST /events/:id/finalize`
- `GET /settings/timetable/schedules/:id`
- `GET /track_new_events.json`
- `POST /graphql`

Źródło: `backend/salonbw-backend/src/versum-compat/versum-compat.controller.ts`.

## Warstwa `VersumConfig`

- Tworzona w `buildCalendarEmbedConfig` w `apps/panel/src/pages/api/calendar-embed.ts`.
- Udostępnia legacy struktury oczekiwane przez vendored runtime.
- Część wartości ma charakter stały/legacy i nie jest zgodna z przyszłym natywnym kontraktem modułowym.

## Aktywa `versum-calendar` / `salonbw-calendar`

- Runtime embed nadal opiera się na vendored asset pipeline.
- Istnieją testy kompatybilności (`calendarEmbedRuntime`, `middlewareAssets`, `calendarViewsRuntime`).

## Natywne elementy już istnieją (ale nie są route-primary)

- Frontend:
  - `apps/panel/src/components/calendar/CalendarView.tsx` (FullCalendar)
  - `apps/panel/src/hooks/useCalendar.ts` (React Query + `/calendar/events`)
  - mutacje `reschedule`, `time-blocks`, `conflicts`
- Backend:
  - `calendar.controller.ts` (`/calendar/events`, `/calendar/time-blocks`, `/calendar/conflicts`)
  - `appointments.controller.ts` (`/appointments/:id/reschedule`, status actions)

## Ryzyka dalszego rozwoju przez iframe

- Brak spójności z `SalonShell` i globalnymi wzorcami UX.
- Duplikacja logiki autoryzacji, config i routingu w warstwie embed.
- Trudniejsza obserwowalność i testowalność end-to-end.
- Rosnący koszt utrzymania aliasów compat (`/events`, `/graphql`, `/track_new_events`).
- Ograniczona iteracja Booksy-like (drawer, unified state, cross-module actions).

## Jednoznaczne wnioski

- Czy rekomendujemy dalszy rozwój legacy iframe? **Nie** (poza utrzymaniem i hotfixami).
- Czy rekomendujemy migrację na natywny moduł React/FullCalendar? **Tak**.
- Czy potrzebny okres przejściowy `/calendar-legacy` + `/calendar-next`? **Tak**.

## Decyzja docelowa

- Faza przejściowa:
  - `/calendar` -> legacy iframe
  - `/calendar-next` -> natywny moduł Booksy-like
- Po switchu:
  - `/calendar` -> natywny
  - `/calendar-legacy` -> fallback awaryjny
