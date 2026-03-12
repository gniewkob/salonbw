# Calendar Flow Spec (Versum-Compatible Embed)

Last updated: 2026-02-04

## Runtime Entry

1. User opens `/calendar`.
2. Next.js page `apps/panel/src/pages/calendar.tsx` fetches `/api/calendar-embed`.
3. The page writes the returned vendored HTML into `document` (direct embed; no iframe).
4. Vendored scripts call compat endpoints on the same origin:
   - `/events/*`
   - `/settings/timetable/schedules/*`
   - `/graphql`
   - `/track_new_events.json`
   - `/salonblackandwhite/*` compatibility aliases (rewritten to local routes)

## Output Contract

Current verified contract in repo:

- `/calendar` does not render a React container for the vendored runtime.
- `apps/panel/src/pages/calendar.tsx` replaces the whole document using:
  - `document.open()`
  - `document.write(html)`
  - `document.close()`
- `apps/panel/src/pages/api/calendar-embed.ts` therefore returns a full HTML document, not a JSX fragment and not a partial body by default.
- The handler injects runtime config and auth interception into the returned document before `</head>`.

Verified consequences:

- script ordering in the returned HTML matters;
- `<head>` content is part of the runtime contract;
- a refactor that serializes only `#main-content` is not behaviorally equivalent unless it deliberately reconstructs required scripts/styles.

## PJAX Status

Current verified state in repo:

- the in-repo `/calendar` page does not send an `x-pjax` header when fetching `/api/calendar-embed`;
- no active in-repo caller was found that requests `/api/calendar-embed` as a PJAX fragment;
- the live Versum panel uses PJAX inside some modules such as customer-list pagination, but this was not observed for calendar HTML embedding.

Current implementation detail:

- `apps/panel/src/pages/api/calendar-embed.ts` no longer contains a PJAX-specific response branch;
- the handler always returns a full HTML document with runtime config and auth interception injected into `<head>`.

Implication:

- calendar embed should be treated as full-document runtime only unless a real calendar caller requiring PJAX HTML is identified and specified.

## Routing / Proxy

`apps/panel/next.config.mjs` rewrites:

- `/salonblackandwhite/events/:path*` -> `/api/events/:path*`
- `/salonblackandwhite/settings/timetable/schedules/:path*` -> `/api/settings/timetable/schedules/:path*`
- `/salonblackandwhite/track_new_events.json` -> `/api/track_new_events.json`
- `/salonblackandwhite/graphql` -> `/api/graphql`
- `/events/:path*` -> `/api/events/:path*`
- `/settings/timetable/schedules/:path*` -> `/api/settings/timetable/schedules/:path*`
- `/track_new_events.json` -> `/api/track_new_events.json`
- `/graphql` -> `/api/graphql`

`/api/*` then proxies to backend API host via `apps/panel/src/pages/api/[...path].ts`.

Embed HTML is served by:
- `apps/panel/src/pages/api/calendar-embed.ts` (reads `apps/panel/public/versum-calendar/index.html` and injects runtime config)

## Backend Compat Endpoints

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

## Capture Handling

- Raw captures are not committed (privacy cleanup).
- During parity verification, save temporary captures under `output/playwright/versum-calendar/`.
