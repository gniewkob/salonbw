# Panel ↔ API Security Hardening — May 2026

Reference document for the 9-commit hardening pass that ran on
2026-05-14 → 2026-05-15. Source of truth for "what was changed and
why" so we don't regress.

## Scope

Code review across `apps/panel/` and its relationship to the NestJS
API. Each finding was either fixed in this pass or deliberately left
as a follow-up.

## Outcomes at a glance

| # | Commit     | Area                                | Status        |
|---|------------|-------------------------------------|---------------|
| 1 | `02ff23e0` | Bearer token in calendar embed      | shipped, live |
| 2 | `92e70e65` | httpOnly cookie / no JS overwrite   | shipped, live |
| 3 | `19d01beb` | CSP header + XFO conflict fix       | shipped, live |
| 4 | `72d6e584` | Singleton refresh promise + retry init | shipped, live |
| 5 | `6d8fca1b` | `useProductCategories` real endpoint | shipped, live |
| 6 | `3ac722ab` | Hardening pack (9 sub-items)        | shipped, live |
| 7 | `c5555384` | Calendar embed deletion + tighter CSP + SSO docs (-572k LOC) | shipped, live |
| 8 | `5b37925a` | N+1 fallback capped at 5 customers  | shipped, live |
| 9 | `0a447c39` | `'unsafe-inline'` removed from `script-src` | shipped, live |

Production CSP on `panel.salon-bw.pl` after the pass: see
`docs/SECURITY_HEADERS.md`.

## Findings and fixes

### 1. Bearer token inlined into vendored calendar HTML

**File:** `apps/panel/src/pages/api/calendar-embed.ts` (deleted in #7)

The `/api/calendar-embed` handler read `accessToken` from cookies and
injected it as `const token = '${accessToken}'` inside a `<script>`
block in the served HTML. Any XSS, browser extension content script,
or "view source" on the embed page exposed the bearer.

Initial fix (#1): the inlining was redundant — `/events`, `/graphql`,
`/settings/timetable/*`, `/track_new_events.json` are all rewritten
to `/api/*` by `next.config.mjs`, and the proxy at
`apps/panel/src/pages/api/[...path].ts` already injects
`Authorization: Bearer <accessToken>` from the cookie server-side.
The inline token was stripped together with the fetch/XHR
interceptors that consumed it; the URL rewriter for
`/calendar/views*` stayed because it is unrelated to auth.

Final fix (#7): the whole embed was deleted along with the vendored
Versum HTML, since the React port at `/calendar-next` was the real
calendar all along.

### 2. JS-side `accessToken` cookie + localStorage mirror

**File:** `apps/panel/src/contexts/AuthContext.tsx`

The panel used to set `accessToken` via `js-cookie` with only
`{ domain: '.salon-bw.pl', path: '/' }` — no `secure`, no
`sameSite`, not httpOnly — and parallel-write to `localStorage` as
`jwtToken`. Backend was already issuing the same name as a httpOnly
cookie, so two writers raced for the same cookie name and the
JS-side copy was XSS-readable.

Fix: remove the JS-side writes entirely. The backend is the only
source of `accessToken` / `refreshToken`. The panel observes session
state through the non-HttpOnly `sbw_auth` hint cookie and the
browser-readable `XSRF-TOKEN`, both of which the backend sets
explicitly. This contract is now documented in `Agent.md §6`.

### 3. CSP claimed but missing + X-Frame-Options conflict

**Files:** `apps/panel/next.config.mjs`, `apps/panel/src/middleware.ts`

A comment at the top of `next.config.mjs` claimed *"CSP is now
handled by middleware.ts with nonce generation"*. `middleware.ts`
contained zero CSP code. The comment had been there long enough that
`docs/SECURITY_HEADERS.md` repeated the same claim.

Separately, the global `headers()` rule emitted `X-Frame-Options:
DENY` while a per-route rule for `/api/calendar-embed` emitted
`SAMEORIGIN`. Browsers resolve conflicting XFO headers to the most
restrictive value — i.e. DENY — which would have blocked the
embed iframe.

Fix: add a real, static CSP to `securityHeaders`. Set the global
XFO to `SAMEORIGIN` and remove the per-route override (later
tightened to `DENY` in #7 after the embed was deleted). The CSP at
that point still kept `'unsafe-inline'` and `'unsafe-eval'` on
`script-src` to keep the vendored embed working; both were removed
in #7 and #9.

### 4. Race on token refresh

**File:** `packages/api/src/api.ts`

When N requests received 401 at the same time, `ApiClient.execute`
fired N parallel `POST /auth/refresh` calls. With rotating refresh
tokens, all but the first lost the race and got back 401 /
"token reused", which then triggered an unnecessary logout from an
otherwise-recoverable state.

Fix: gate the refresh in a shared `refreshInFlight` promise. The
first 401 starts the refresh; subsequent 401s await the same promise
and reuse its tokens. The slot clears via `.finally` after the
refresh settles so later refresh cycles still work.

Same commit fixed a long-standing bug in the retry path: after a
successful refresh, the retry used to fetch with `{ ...init, headers,
credentials }` — spreading only the caller-supplied `init` and
dropping the merged `baseInit` (e.g. the CSRF header bag from
AuthContext). If the caller did not set `method` in `init`, the
retry silently degraded to GET. Switched to `{ ...mergedInit, method,
headers, credentials }`.

New regression test in `apps/panel/src/__tests__/authRefresh.test.ts`
asserts exactly one `/auth/refresh` for three concurrent 401s.

### 5. `useProductCategories` pointed at a non-existent endpoint

**File:** `apps/panel/src/hooks/useProducts.ts`

`useProductCategories` called `/products/categories`. The backend's
`ProductsController` has `@Get(':id')`, so the literal string
`"categories"` was parsed as a product id, hit the validation pipe,
and returned 400/404. The two pages that imported the hook
(`/settings/categories/new`, `/settings/categories/[id]/edit`) never
populated their parent-category selector.

A correct copy of the hook already lived in
`apps/panel/src/hooks/useWarehouseViews.ts` and called
`/product-categories/tree`. Fix: re-export from there so existing
imports keep working without caller changes.

### 6. Hardening pack (9 sub-items)

**Files:** various

A grab-bag of follow-ups:

- `packages/api/src/api.ts`: gate the `[ApiClient] Init` console
  log behind `debugEnabled()` so the configured API URL no longer
  leaks into every browser console.
- `apps/panel/src/contexts/AuthContext.tsx`: `fetchProfile` only
  treats 401/403 as "not logged in"; transient 5xx / network blips
  no longer log the user out. `setLogoutCallback` now has a useEffect
  cleanup so a stale unmounted AuthProvider can't call setState on
  a dead instance.
- `apps/panel/src/api/auth.ts`: `login`, `register`, `refreshToken`
  preserve `ApiError.status` via a `rethrowWithStatus` helper.
  Forms / telemetry can now branch on `400 invalid creds` vs `401
  unauthorized` vs `5xx transient`.
- `apps/panel/src/sentry.client.ts`: `sendDefaultPii: false` plus a
  `beforeSend` that strips `request.cookies` and Filtered-marks
  `cookie` / `authorization` / `x-xsrf-token` / `set-cookie` headers
  plus drops `user.ip_address`. Session-bearing data no longer ships
  to Sentry replays or breadcrumbs.
- `apps/panel/src/utils/logClient.ts` + `apps/panel/src/pages/api/[...path].ts`:
  the client-log endpoint used to ship `x-log-token` from
  `NEXT_PUBLIC_LOG_TOKEN` — a "secret" baked into the JS bundle and
  readable by anyone who viewed source. Now the panel posts to the
  same-origin proxy at `/api/logs/client` and the proxy injects
  `x-log-token` from the server-side env `CLIENT_LOG_TOKEN`. The
  bundle no longer carries the token. `Agent.md §6` was updated to
  document `CLIENT_LOG_TOKEN` and call out that it must never be
  exposed as a `NEXT_PUBLIC_*` variable.
- Six statistics pages (`returning`, `origins`, `warehouse/changes`,
  `warehouse/value`, `worktime`, `employees`) all shared a broken
  `useEffect(() => { void fetchData(); }, [dateRange])` pattern with
  `// eslint-disable-next-line react-hooks/exhaustive-deps`, a silent
  `console.error` in the catch, and no error UI. Rapid date-range
  changes raced; transient API failures showed an empty table with
  no signal to the user. Migrated all six to a single shape used in
  `follow-up.tsx`: inline `useEffect` with a `cancelled` flag,
  `error` state surfaced as an `alert alert-warning`,
  `encodeURIComponent` on params, defensive `Array.isArray` checks.
  `employees.tsx` also moved from raw `fetch('/api/...')` to
  `apiFetch` so it now rides the same bearer / refresh / CSRF flow
  as the rest of the panel.

### 7. Vendored Versum calendar embed deletion

**Files:** ~150 deletions across `apps/panel/src/pages/`,
`apps/panel/public/versum-calendar/`, `apps/panel/next.config.mjs`,
`apps/panel/src/middleware.ts`, related tests

The `/calendar` route had two implementations:

- A 25-line iframe wrapping `/api/calendar-embed`, which served
  ~96 KB of vendored Versum HTML + inline scripts + the
  server-injected bearer token (the same hole #1 patched).
- A 1621-line React port at `/calendar-next` that the routing,
  sidebars, and `postLoginRoute` already directed admins and
  receptionists to.

Every CSP compromise on this panel (`script-src 'unsafe-inline'
'unsafe-eval'`, the XFO override, `frame-ancestors 'self'`, ~50 KB
of "compat" rewrites for `/events`, `/graphql`,
`/track_new_events.json`, `/settings/timetable/schedules/*`,
`/salonbw-calendar/*`, `/salonbw-vendor/*`,
`/salonblackandwhite/*`) traced back to the embed.

Per product decision: the embed goes, the React port becomes
`/calendar`. Specifically:

- `apps/panel/src/pages/calendar.tsx` (iframe) + `.bak` deleted
- `apps/panel/src/pages/api/calendar-embed.ts` deleted
- `apps/panel/src/__tests__/calendarEmbedRuntime.test.ts` deleted
- `apps/panel/public/versum-calendar/` (~150 files, the 96 KB HTML
  plus vendored JS/CSS/PNG assets) deleted
- `apps/panel/src/pages/calendar-next.tsx` renamed to
  `apps/panel/src/pages/calendar.tsx`
- All routing (`postLoginRoute`, `navigation.ts`) collapsed onto
  `/calendar`; admins, receptionists, and employees all land on the
  React port now
- `/calendar-next` → `/calendar` permanent redirect added for
  bookmarks
- Embed-only rewrites and `isPublicDashboardAssetPath` entries
  removed
- `normalizeCompatStatus` (the `POST /graphql` 201→200 hack) reduced
  to passthrough but kept exported so callers don't have to change
- CSP tightened in lockstep: `'unsafe-eval'` dropped from
  `script-src`, `frame-src` and `frame-ancestors` → `'none'`,
  `X-Frame-Options` → `DENY`
- `Agent.md §6` now documents that `.salon-bw.pl` cookies are
  intentional SSO between dev/landing/panel and that the panel
  must not mirror httpOnly tokens into localStorage / Cookies.set

Build delta: -572150 / +1724 lines.

### 8. N+1 fallback on calendar alert stats

**File:** `apps/panel/src/pages/calendar.tsx`

The reception view populates per-customer CRM alert badges by hitting
`/customers/statistics/batch?ids=...`. When that batch endpoint
failed, the catch arm fanned out to one `/customers/:id/statistics`
GET per missing customer. On a busy reception view that's 20–50
calls per re-render, and on a persistent batch failure it repeated
every render tick.

Fix: cap the fallback at `FALLBACK_MAX_CUSTOMERS = 5`. For small N
the fallback still resolves cleanly (one bad batch isn't a
catastrophe), but above the cap the code returns "all failed"
entries immediately. The retry banner already in the UI surfaces
`customerAlertStatsError` and the user can hit "Ponów teraz" once
the backend is healthy.

New test asserts that with 8 visible customers and a malformed batch
response, zero per-customer GETs are issued and the error banner
appears.

### 9. `'unsafe-inline'` removed from `script-src`

**Files:** `apps/panel/src/pages/_app.tsx`, `apps/panel/next.config.mjs`

After #7 dropped `'unsafe-eval'`, the only remaining inline
`<script>` emitted by the panel was a 6-line gtag bootstrap shipped
via `<Script id="ga4-init" strategy="afterInteractive">`. GA is
disabled in production (no `NEXT_PUBLIC_ENABLE_ANALYTICS=true`) so
the inline block isn't rendered today, but leaving `'unsafe-inline'`
in `script-src` "just in case" is the kind of latent hole that bites
the moment someone toggles GA on.

Fix: move the bootstrap into the React bundle. The external
`googletagmanager.com/gtag.js` loader keeps its `<Script>` tag, and
its `onLoad` handler now does the `dataLayer` + `gtag('config', ...)`
setup. Zero `<script>` body emitted to the HTML; CSP is satisfied
via `'self'` alone. Same observable behaviour for analytics.

CSP delta:

```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com
→
script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com
```

`style-src` keeps `'unsafe-inline'` (out of scope — see future-work
section in `docs/SECURITY_HEADERS.md`).

## Already-clean items the review flagged

These were called out by the review but turned out to already be
fine after earlier commits in the sequence — no separate change
needed:

- `hostname.includes('salon-bw.pl')` attacker bypass: the JS-side
  cookie writes that contained this check were removed in #2, so
  the bypass surface is gone.
- `REFRESH_TOKEN_KEY` duplicated constant: the parallel definition
  in `AuthContext.tsx` was removed in #2; only `auth.ts` keeps the
  constant now.
- `decodeJwtPayload` without signature verification: the function
  only existed inside the deleted `calendar-embed.ts`; #7 removed it.

## Deliberately out of scope

These were called out by the review but left for a follow-up because
they need product / architectural decisions or a refactor that did
not fit in this pass:

- `'unsafe-inline'` on `style-src`. Needs a CSS-in-JS migration to
  unwind react-datepicker / recharts / Bootstrap inline styles.
- Backend GraphQL `201 → 200` behaviour itself. The frontend
  `normalizeCompatStatus` shim is gone; the backend can be cleaned
  up separately.
- Pre-existing 4 failing tests (`contactForm`,
  `customersCrashGuards`, `AdminDashboard`, `layout`) that were
  already broken before this pass.

## Coordination with Codex

Codex was working in parallel on `.github/workflows/deploy.yml`
during this session, landing three CI/CD fixes (`0dc3a178`,
`d8d69729`, `f2d75918`). Those interact with — but are independent
of — the panel hardening. Backend changes that were uncommitted
locally during this session were left untouched per the agreed
hands-off boundary.

## Verification

After each commit:

- `pnpm --filter @salonbw/panel exec tsc --noEmit` — 0 errors
- `pnpm --filter @salonbw/panel lint` — 0 errors (6 pre-existing
  warnings)
- `pnpm jest` (panel) — 204 / 210 pass (the 4 failures listed above
  are pre-existing and unrelated)

Live smoke after final deploy on `panel.salon-bw.pl`:

```
HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; ...; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; ...
x-frame-options: DENY
strict-transport-security: max-age=63072000; includeSubDomains; preload
```
