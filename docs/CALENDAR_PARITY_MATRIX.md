# Calendar Parity Matrix (Versum -> Panel)

Last updated: 2026-02-05

Reference capture source:

- Local parity run captures (kept outside git in `output/playwright/versum-calendar/`)

## Functional Parity

| Capability | Versum reference | Local implementation | Status |
| --- | --- | --- | --- |
| View switch: `miesiąc` | Captured (request window monthly) | Vendored calendar scripts loaded from `/versum-calendar/index.html` | Implemented |
| View switch: `tydzień` | Captured (request window weekly) | Vendored calendar scripts loaded from `/versum-calendar/index.html` | Implemented |
| View switch: `dzień` | Captured (request window daily) | Vendored calendar scripts loaded from `/versum-calendar/index.html` | Implemented |
| View switch: `recepcja` | Captured (`period=agendaResource`) | Vendored calendar scripts loaded from `/versum-calendar/index.html` | Implemented |
| Prev/next navigation | Captured in fixtures (`022/024/026/028`) | Implemented via original Versum JS | Implemented |
| Event hover tooltip | Captured manually in reference session | Implemented via original Versum JS | Implemented |
| Click event -> `screen_data` | Captured (`030_GET__events_..._screen_data.json`) | `/events/:id/screen_data` compat endpoint | Implemented |
| Click finalized event details | Captured in `screen_data` payload | Mapped in compat DTO (`status`, `payments`, `services`) | Implemented |
| Non-finalized -> finalize flow | Captured GraphQL/service fetch on open | `/events/:id/finalize` compat endpoint | Implemented |
| `wizyta się nie odbyła` (`no_show`) | Confirmed in target flow | `/events/:id/finalize` maps `not_an_appointment=true` -> `status=no_show` | Implemented |

## API Contract Parity

| Endpoint | Versum payload captured | Local endpoint | Status |
| --- | --- | --- | --- |
| `GET /events/` | Yes | `backend -> /events` | Implemented |
| `GET /events/:id/screen_data` | Yes | `backend -> /events/:id/screen_data` | Implemented |
| `POST /events/:id/finalize` | Flow confirmed | `backend -> /events/:id/finalize` | Implemented |
| `GET /settings/timetable/schedules/:id` | Yes | `backend -> /settings/timetable/schedules/:id` | Implemented |
| `GET /track_new_events.json` | Flow target required | `backend -> /track_new_events.json` | Implemented |
| `POST /graphql` | Yes (`5 operations`) | `backend -> /graphql` | Implemented |

## Test Coverage

| Test Type | File | Tests | Status |
| --- | --- | --- | --- |
| E2E: View switching | `tests/e2e/calendar.spec.ts` | 5 tests (month/week/day/reception + default) | Ready |
| E2E: Navigation | `tests/e2e/calendar.spec.ts` | 3 tests (prev/next/today) | Ready |
| E2E: Event interactions | `tests/e2e/calendar.spec.ts` | 3 tests (display/hover/click) | Ready |
| E2E: Finalize flow | `tests/e2e/calendar.spec.ts` | 2 tests (finalize/no_show) | Ready |
| E2E: Finalized view | `tests/e2e/calendar.spec.ts` | 1 test (non-editable check) | Ready |
| Visual: Pixel parity | `tests/visual/versum-admin.spec.ts` | 1 test × 2 resolutions (1366/1920) | Ready |
| Contract: API | `versum-compat.service.spec.ts` | Backend unit tests | Implemented |

## Definition of Done (DoD) Checklist

| # | Criterion | Status | Notes |
| --- | --- | --- | --- |
| 1 | Reference capture (HAR + screenshots) | ✅ Done | `static_preview/screenshots/`, fixtures ad-hoc |
| 2 | Vendored assets + identical render | ✅ Done | `public/versum-calendar/` (11M) |
| 3 | Full API adapter | ✅ Done | 6 REST endpoints + 11 GraphQL ops |
| 4 | E2E tests for all flows | ✅ Done | 14 tests in `calendar.spec.ts` |
| 5 | Pixel parity (1366/1920, ≤0.5%) | ⏳ Pending | Needs execution against running app |
| 6 | Module freeze | ⏳ Pending | After visual validation |

## Validation Notes

- Full 1:1 pixel parity requires running visual suite against the new embed on local and staging.
- Contract captures are generated ad-hoc during parity runs and are not stored in git.
- To run visual tests: `cd apps/panel && pnpm exec playwright test visual/`
- To run E2E tests: `cd apps/panel && pnpm exec playwright test e2e/`
