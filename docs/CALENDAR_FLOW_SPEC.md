# Calendar Flow Spec (Native React Calendar)

Last updated: 2026-07-12

## Runtime Entry

1. User opens `/calendar`.
2. Next.js renders `apps/panel/src/pages/calendar.tsx` through `RouteGuard` and `SalonShell`.
3. Calendar data is loaded by `apps/panel/src/hooks/useCalendar.ts` from `/api/calendar/events` and `/api/calendar/time-blocks`.
4. Appointment details and mutations use canonical `/api/appointments/*` endpoints.

## Output Contract

Current verified contract in repo:

- `/calendar` renders a native React page with responsive day, week, month and reception views.
- `CalendarView`, `ReceptionView` and `StaffAppointmentCalendarView` own the main calendar presentation.
- React Query hooks own loading, retry and cache invalidation for calendar data.

## Navigation State

The native calendar does not use a document rewrite or PJAX embed. Route changes are synchronized through `useCalendarUrlSync`, and data requests are scoped to the selected date, view and employees.

## Routing / Proxy

Legacy Versum aliases are retained only for compatibility and are not used by the native calendar runtime.

Canonical requests go through `/api/*`, which proxies to the backend API host via `apps/panel/src/pages/api/[...path].ts`.

## Legacy Versum Compatibility Endpoints

The following endpoints are retained for legacy clients and old captures. They are not called by the native React calendar described above.

Controller: `backend/salonbw-backend/src/versum-compat/versum-compat.controller.ts`
Service: `backend/salonbw-backend/src/versum-compat/versum-compat.service.ts`

### `GET /events/`

Request shape (captured):
- `format=json`
- `user_ids[]`
- `start`
- `end`

Response shape:
- Array of event objects compatible with Versum calendar renderer.

### `GET /events/:id/screen_data`

Response shape:
- `{ events: [detailedEvent], formulas: null, prepayment_balance: 0, overpayment_balance: 0 }`

### `POST /events/:id/finalize`

Behavior:
- `not_an_appointment=true` -> appointment status `no_show`
- otherwise -> appointment status `completed`

Response:
- `{ success: true, event: detailedEvent }`

### `GET /settings/timetable/schedules/:id`

Request shape (captured):
- `format=json`
- `employee_ids[]`
- `date`
- `period=agendaResource|agendaWeek|month`

Response shape:
- date-keyed map with employee open/closed segments.

### `POST /graphql`

Supported `operationName` values:
- `GetNetGrossTranslationType`
- `GetViewer`
- `GetEmployees`
- `GetNotificationCenterUnreadCount`
- `GetNotificationCenterPushNotifications`
- `GetNotificationCenterNotifications`
- `GetNotificationCenterNotification`
- `ReadNotificationCenterPushNotification`
- `ReadNotificationCenterNotification`
- `GetServiceCategories`
- `GetServices`
- `GetAllServices`

### `GET /track_new_events.json`

Response:
- `{ events: [] }`

## Key Data Mapping Rules

- Payment method mapping:
  - `card` -> `credit_card`
  - `voucher` -> `certificate`
- Finalized state:
  - `completed` -> `finalized=true`
- No-show state:
  - `no_show` -> `not_an_appointment=true`
- Event IDs:
  - `id` in feed mapped to `"<appointmentId>_<serviceRefId>"`

## Legacy Capture Handling

- Raw captures are not committed (privacy cleanup).
- During any legacy parity verification, save temporary captures under `output/playwright/versum-calendar/`.
