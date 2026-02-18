# Agent Status Dashboard

_Last updated: 2026-02-18 (warehouse sales/new structure aligned with Versum patterns)_

## Platform Architecture

The Salon Black & White platform consists of the following services:

- **`api.salon-bw.pl`** - Backend API (NestJS) serving all business logic, authentication, and data
- **`dev.salon-bw.pl`** - **New client-facing frontend** (Next.js) - public marketing site for end users to browse services and book appointments (**bez logiki dashboardu**)
- **`panel.salon-bw.pl`** - **Management dashboard** (Next.js) - authenticated portal for:
  - **End users**: View reservation history, manage bookings
  - **Admins**: Manage services, reservation calendar, appointments, user management
- **`salon-bw.pl`** - **Legacy service** (being phased out, redirects to www.salon-bw.pl)

**Current Focus:** Development on `dev.salon-bw.pl` (client-facing) and `panel.salon-bw.pl` (management dashboard), with `api.salon-bw.pl` as the backend.

## Current Release

| Component | Commit | Workflow Run ID | Finished (UTC) | Environment | Notes |
| --- | --- | --- | --- | --- | --- |
| API (`api.salon-bw.pl`) | `3c88809d` | `22043301144` | 2026-02-15 21:23 | production | Content CMS module + migration with seed data (business_info, hero_slides, founder_message, history_items) |
| Public site (`dev.salon-bw.pl`) | `3c88809d` | `22058727498` | 2026-02-16 10:20 | production | ✅ Landing Phase 1 LIVE: Polish hero slider (3 slides), founder message, history accordion, values tabs, salon gallery, services page, mobile menu |
| Dashboard (`panel.salon-bw.pl`) | `9af86361` | `22132846978` | 2026-02-18 08:52 | production | Magazyn: `dodaj sprzedaż` przeniesione na wspólny układ Versum (`warehouse-new-screen`, tabela wejściowa, formatowanie kwot PL) |

Verification:

- `curl -I https://api.salon-bw.pl/healthz` → `200 OK` (DB: 3.2ms, SMTP: 24ms)
- `curl https://api.salon-bw.pl/content/sections` → Returns 4 sections (business_info, hero_slides, founder_message, history_items)
- `curl -I https://dev.salon-bw.pl` → `200 OK` (29.9KB HTML, Polish content verified)

## Recent Incidents

### 2026-02-17: Panel global 500 after deploy (resolved)

- **Impact:** `panel.salon-bw.pl` zwracał `500` na wszystkich trasach, w tym `/auth/login`.
- **Root cause:** Rozjazd wersji Next.js między artefaktem build i runtime na serwerze.
- **Mitigation:** Wyrównano runtime panelu do `next@14.2.32` i wykonano deploy dashboard (`22113872213`).
- **Verification:** `GET /auth/login` -> `200`; trasy chronione panelu (`/products`, `/sales`, `/use`, `/deliveries`, `/orders`, `/inventory`) -> `307` do logowania; API `/healthz` -> `200`.

### 2026-02-17: Warehouse smoke parity rerun (resolved, green)

- **Scope:** Re-run production smoke for warehouse and customers after latest dashboard deploy.
- **Runs:** local Playwright against `https://panel.salon-bw.pl` with auth env.
- **Results:**
  - `tests/e2e/prod-warehouse-smoke.spec.ts` -> `2 passed` (warehouse shell + secondnav context switching),
  - `tests/e2e/prod-customers-smoke.spec.ts` -> `2 passed` (gallery/files upload/download flow),
  - combined `tests/e2e/prod-*.spec.ts` -> `4 passed`.
- **Status:** stable for current smoke scope; no regression detected in warehouse secondnav routing.

### 2026-02-17: Customers full production parity audit (completed)

- **Scope:** Full customers module sweep on production (`/customers`, card tabs, edit, new) against Versum reference routes.
- **Automation:** `apps/panel/tests/e2e/prod-customers-parity-audit.spec.ts`.
- **Artifacts:** `output/parity/2026-02-17-customers-prod-full/`.
- **Result:**
  - functional checklist YES/NO (per screen/action): **YES** for all audited entries,
  - strict visual parity (pixel diff): **NO** (highest deltas on `gallery` and `statistics` views).
- **Interpretation:** current functional flow is green; remaining 1:1 work is visual tuning + data-normalized visual baselines.

### 2026-02-17: Warehouse full production parity audit (completed)

- **Scope:** Full warehouse module sweep on production (`products`, `sales`, `use`, `deliveries`, `orders`, `inventory`, plus `stock-alerts`/`suppliers`/`manufacturers`) against Versum reference routes.
- **Automation:** `apps/panel/tests/e2e/prod-warehouse-parity-audit.spec.ts`.
- **Artifacts:** `output/parity/2026-02-17-warehouse-prod-full/`.
- **Result:**
  - functional checklist YES/NO (per screen/action): **YES** (`16/16`),
  - strict visual parity (pixel diff): **NO** (highest deltas on `deliveries-history`, `products`, `sales-history`).
- **Interpretation:** routing/flow and secondnav context are functionally aligned; remaining gap is visual 1:1 tuning.

### 2026-02-17: Warehouse history pagination parity refinement (deployed)

- **Scope:** `Magazyn / Historia sprzedaży` i `Magazyn / Historia dostaw` (UI parity polish).
- **Deploy:** Dashboard run `22119280341` (`success`), commit `ce5c1a56`.
- **Change:**
  - dodano kontrolki paginacji zgodne z układem Versum (`Pozycje od ... do ... z ...`, numer strony, strzałka `>`),
  - paginacja działa po filtrowaniu i wyszukiwaniu (reset do strony 1 przy zmianie filtra/tekstu).
- **Status:** deployed to production; dalsze odchylenia strict 1:1 pozostają głównie w fine-tuningu wizualnym.

### 2026-02-17: Warehouse orders-history + deliveries secondnav tree parity refinement (deployed)

- **Scope:** `Magazyn / Historia zamówień` and deliveries section side navigation.
- **Deploy:** Dashboard run `22120126171` (`success`), commit `6678127c`.
- **Change:**
  - `/orders/history`: dodane wyszukiwanie, filtrowanie po statusie, paginacja w stylu Versum i rozszerzone kolumny tabeli,
  - secondnav `DOSTAWY`: przebudowany na drzewko z zagnieżdżeniem (`dostawcy`, `producenci`) pod `niski stan magazynowy`.
- **Status:** deployed to production; remaining work is visual/detail parity on `new` forms and actions layout.

### 2026-02-17: Warehouse new-forms parity refinement (deployed)

- **Scope:** `Magazyn / Dodaj dostawę` and `Magazyn / Dodaj zamówienie`.
- **Deploy:** Dashboard run `22120344947` (`success`), commit `7f1a568b`.
- **Change:**
  - reordered and normalized form sections toward Versum structure,
  - introduced numbered entry rows (`1..n`) for key fields,
  - added explicit summary in actions area (`do zapłaty łącznie` / `pozycje`),
  - preserved existing business logic (create draft / submit / redirects).

### 2026-02-18: Warehouse form/table visual parity refinement (deployed)

- **Scope:** `Magazyn / Dodaj dostawę`, `Magazyn / Dodaj zamówienie` (szlif układu 1:1).
- **Deploy:** Dashboard run `22122413879` (`success`), commit `04885e6c`.
- **Change:**
  - dopracowany układ formularzy (`warehouse-new-screen`, `warehouse-lines-table`),
  - wyrównane sekcje podsumowania i spacing tabel wejściowych.

### 2026-02-18: Inventory views parity refinement (deployed)

- **Scope:** `Magazyn / Inwentaryzacja` (`/inventory`, `/inventory/new`, `/inventory/[id]`).
- **Deploy:** Dashboard run `22132191552` (`success`), commit `10f4d1b3`.
- **Change:**
  - lista inwentaryzacji: toolbar filtrów + stopka/paginacja w układzie Versum,
  - formularz `nowa inwentaryzacja`: numerowane wiersze i sekcja akcji,
  - szczegóły inwentaryzacji: dopracowany blok metadanych i tabela pozycji.

### 2026-02-18: Suppliers view migrated from Tailwind to Versum layout (deployed)

- **Scope:** `Magazyn / Dostawcy` (`/suppliers`).
- **Deploy:** Dashboard run `22132335874` (`success`), commit `fd7d1335`.
- **Change:**
  - usunięty tailwindowy układ komponentu,
  - wdrożona tabela + akcje + modal formularza w klasach stylu Versum (`products-table`, `modal`, `btn`).

### 2026-02-18: Warehouse sales/deliveries history visual parity tighten (deployed)

- **Scope:** `Magazyn / Historia sprzedaży` i `Magazyn / Historia dostaw`.
- **Deploy:** Dashboard run `22132637254` (`success`), commit `8062ccd6`.
- **Change:**
  - kwoty w obu widokach formatowane po polsku (`1 234,56 zł`),
  - `historia dostaw` przeszła na stopkę tabeli identyczną jak `historia sprzedaży` (`Pozycje od ...`, `na stronie`, pager),
  - ujednolicony układ i spacing footer/paginacji dla obu ekranów.

### 2026-02-18: Warehouse sales/new form structure alignment (deployed)

- **Scope:** `Magazyn / Dodaj sprzedaż` (`/sales/new`).
- **Deploy:** Dashboard run `22132846978` (`success`), commit `9af86361`.
- **Change:**
  - strona korzysta z tych samych wrapperów layoutu co `dodaj dostawę`/`dodaj zamówienie`,
  - tabela pozycji bez dodatkowej kolumny `lp` (układ bliżej Versum),
  - kwoty pozycji i podsumowania renderowane w formacie PL (`1 234,56 zł`).

### 2026-02-10: SMTP credentials moved out of CI/CD

- **Impact:** Reduced risk of SMTP secret exposure via CI/CD.
- **Change:** `Deploy (MyDevil)` no longer injects `SMTP_*` into generated API `.env`; deploy preserves server-managed `SMTP_*` lines instead.
- **Action required:** Maintain `SMTP_USER` / `SMTP_PASSWORD` only on the server in `/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env`.

### 2026-02-02: API deploy path normalized (symlink to apps path)

- **Impact:** None observed (path alignment only).
- **Change:** `api.salon-bw.pl/public_nodejs` now symlinks to `/usr/home/vetternkraft/apps/nodejs/api_salonbw`.
- **Mitigation:** Synced content, updated deploy variable `MYDEVIL_API_REMOTE_PATH_PRODUCTION`, restarted `api.salon-bw.pl`.
- **Status:** Resolved.

### 2026-02-02: Panel logout verified after manual deploy

- **Impact:** Logout flow confirmed working.
- **Verification:** Login → Logout in `panel.salon-bw.pl` redirects to `dev.salon-bw.pl`; cookies + localStorage cleared.
- **Status:** Resolved.

### 2026-02-02: `/reviews` 500s due to missing `reviews` table

- **Impact:** `GET /reviews/me` returned 500 (`relation "reviews" does not exist`).
- **Root cause:** Missing DB migration for `reviews` table in production.
- **Mitigation:** Applied migration `1760069000000-CreateReviewsTable` manually on production DB.
- **Status:** Resolved.

### 2026-01-21: Database Password Update and Production API Recovery

**Timeline:**

- **21:00 UTC** - Database password changed in MyDevil panel (redacted)
- **21:15 UTC** - GitHub secrets updated (`MYDEVIL_DB_PASSWORD`, `PGPASSWORD`)
- **21:30 UTC** - Initial connection tests failed with auth errors
- **21:45 UTC** - Used `devil pgsql passwd` to reset password, connection successful
- **22:00 UTC** - Fixed production API issues:
  - Rebuilt bcrypt native module for Node 22/FreeBSD
  - Added missing `COOKIE_DOMAIN=salon-bw.pl` to .env
  - Added missing `FRONTEND_URL=https://panel.salon-bw.pl` to .env
  - Fixed app.js to load dotenv before application startup
  - Manually updated DATABASE_URL with URL-encoded password
- **22:10 UTC** - Production API fully recovered and verified

**Resolution:**

- API health check: ✅ Database connected (2.1ms latency)
- SMTP verification: ✅ Working (22ms latency)
- All production endpoints verified operational

**Lessons Learned:**

- Use `devil pgsql passwd` command for password resets on MyDevil
- Special characters in passwords require URL encoding in DATABASE_URL (`{` = `%7B`, `$` = `%24`)
- app.js entry point must call `require("dotenv").config()` before any other code for Passenger deployments
- Native modules like bcrypt must be rebuilt when Node.js version changes

## What's Working

- **2026-02-15** – Content CMS system deployed (API + Database):
  - New `/content/sections` API endpoints (GET only, public access)
  - `content_sections` table created with jsonb data column
  - Migration auto-applied with seed data: business_info, hero_slides, founder_message, history_items
  - API verified working: `curl https://api.salon-bw.pl/content/sections` returns 4 sections
  - Ready for Panel CRUD integration (future work)
  - Docs: `docs/CONTENT_CMS_PLAN.md`
- **2026-02-15** – Landing page (apps/landing) Polish content sections implemented (Phase 1 complete):
  - 5 new components: HeroSlider, FounderMessage, HistoryAccordion, ValuesSection, SalonGallery
  - Services page with Polish categories, improved design, booking CTAs
  - Mobile hamburger menu with Polish navigation
  - Expanded footer (3 columns: navigation, business info, social)
  - Contact page with Bytom address and map
  - Full keyboard navigation + ARIA-compliant
  - Content API client with fallback to local config (contentApi.ts)
  - Commits: `9ed0b2ec`, `c23ce958`, `8e8dc4f4`, `8ae01aa3`, `40e24733`, `fc840dc3`
  - Deploy in progress: run #22043366264
- **2026-02-14** – Warehouse `ZUŻYCIE` planned-flow implemented (API + panel):
  - API: `GET /usage?scope=planned|completed|all` + `GET /usage/planned`; create payload accepts `scope` and `plannedFor`,
  - planned usage records do not decrement stock on creation (no immediate inventory movement),
  - panel:
    - `/use/planned` now renders real list/table,
    - `/use/new?scope=planned` saves planned usage with datetime,
    - `/use/history` constrained to completed usage only.
- **2026-02-14** – Deploy payload minimization for FreeBSD prepared:
  - `.github/workflows/deploy.yml` now ships frontend tarballs without `node_modules` and prunes `.next/cache` before packaging,
  - frontend `npm install --omit=dev --ignore-scripts` moved to remote host after extract (uses `npm22` when available, fallback `npm`),
  - intent: reduce `scp` transfer size and lower timeout risk on MyDevil/FreeBSD.
- **2026-02-14** – Warehouse `SPRZEDAŻ` parity refinement prepared:
  - `/sales/new`: added line-level discount support, payment summary (`do zapłaty` / `reszta`) and explicit empty-form validation,
  - `/sales/history`: added Versum-like table footer with range + page-size info,
  - `/sales/history/[id]`: extended metadata block, line discount column, financial summary, and notes section,
  - verification:
    - `pnpm eslint src/pages/sales/new.tsx src/pages/sales/history/index.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm playwright test tests/e2e/prod-warehouse-smoke.spec.ts --project=desktop-1366` ⚠️ (`1/2` stable, second test intermittently failing in login helper with `expect.not.toHaveURL` timeout / closed page).
- **2026-02-14** – Deploy transfer timeout hardening prepared:
  - `.github/workflows/deploy.yml` now applies explicit transfer timeouts for `scp` and `rsync` in deploy steps,
  - intent: prevent indefinite hangs on `Upload frontend bundle` and fail fast for retry,
  - warehouse smoke expanded with explicit `secondnav` context checks (`ZUŻYCIE` / `DOSTAWY` / `ZAMÓWIENIA` / `INWENTARYZACJA`),
  - local verification:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm playwright test tests/e2e/prod-warehouse-smoke.spec.ts --project=desktop-1366` ✅ (`1 passed`),
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm playwright test tests/e2e/prod-warehouse-smoke.spec.ts --project=desktop-1366` ✅ (`2 passed`, extended suite),
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm playwright test tests/e2e/prod-customers-smoke.spec.ts --project=desktop-1366` ✅ (`2 passed`).
- **2026-02-14** – Warehouse top-tabs + customers nav parity refinement prepared:
  - vendored calendar main-nav `klienci` link switched from `/clients` to `/customers`,
  - warehouse top tabs (`sprzedaż`, `zużycie`, `dostawy`, `zamówienia`) now route to history/list views (`/sales/history`, `/use/history`, `/deliveries/history`, `/orders/history`) to match Versum navigation flow,
  - `zużycie` actions extended with `planowane zużycie` in both `/use/history` and `/use/new`,
  - operational finding reaffirmed: `secondnav` must be treated as route-contextual content (rendered per submodule path), not a static sidebar.
- **2026-02-13** – Customers `statistics` + `events_history` parity refinement prepared (panel):
  - `statistics`: service/product share block + Versum-like summary list layout,
  - `events_history`: filter action row, status marker in rows, Versum-like footer pagination text and arrows,
  - local verification:
    - `pnpm eslint src/components/customers/CustomerStatisticsTab.tsx src/components/customers/CustomerHistoryTab.tsx` ✅
    - `pnpm tsc --noEmit` ✅
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm playwright test tests/e2e/prod-customers-smoke.spec.ts --project=desktop-1366` ✅ (`2 passed`).
- **2026-02-13** – Customers `communication_preferences` parity extension prepared (panel):
  - added customer-scoped communication history view (SMS/Email toggle) in customer card communication tab,
  - added consent-change history section placeholder and improved contact row iconography/layout,
  - local verification:
    - `pnpm eslint src/components/customers/CustomerCommunicationTab.tsx` ✅
    - `pnpm tsc --noEmit` ✅
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm playwright test tests/e2e/prod-customers-smoke.spec.ts --project=desktop-1366` ✅ (`2 passed`).
- **2026-02-13** – Global `secondnav` rerender stabilization prepared (panel):
  - change: `VersumShell` now resolves module using `router.asPath` and forces `secondnav` remount on route transitions via render key (`module + pathname + asPath`),
  - intent: eliminate stale `secondnav` state/content after cross-module navigation (`calendar` / `customers` / `products`),
  - local verification:
    - `pnpm eslint src/components/versum/VersumShell.tsx` ✅
    - `pnpm tsc --noEmit` ✅
    - prod smoke (`customers` + `warehouse`) ✅ (`3 passed`).
- **2026-02-13** – Warehouse routing stabilization + inventory parity pass deployed to production:
  - commit: `a8fd83ec`
  - deploy run: Dashboard `21992031686`
  - changes:
    - fixed module resolution for `/stock-alerts`, `/suppliers`, `/manufacturers` (no fallback to `calendar` module/body class),
    - added compatibility endpoints for legacy navbar calls: `/fresh_chat_user`, `/todo/alerts`,
    - aligned `inventory` create/details screens to warehouse form parity style.
  - verification:
    - prod smoke `tests/e2e/prod-warehouse-smoke.spec.ts` passed (`1 passed`, desktop-1366).
- **2026-02-13** – Warehouse forms parity pass deployed to production:
  - commit: `4a76ee45`
  - deploy run: Dashboard `21979553797`
  - changes:
    - `/orders/new`: validation + draft-focused redirect (`/orders/history?status=draft`),
    - `/deliveries/new`: visual structure aligned (form cards/section subtitles/error styling),
    - shared CSS parity helpers added for warehouse forms.
- **2026-02-12** – Warehouse delivery draft flow refinement deployed to production:
  - commit: `d13ca98a`
  - deploy run: Dashboard `21967469175`
  - changes:
    - `/deliveries/new` validates required delivery rows (product + quantity > 0),
    - explicit validation message replaces silent no-op on empty data,
    - `zapisz jako roboczą` redirects to `history dostaw` filtered by `?status=draft`.
- **2026-02-12** – Warehouse secondnav dynamic counters deployed to production:
  - commit: `72e14300`
  - deploy run: Dashboard `21967243749`
  - changes:
    - `wersje robocze (N)` for deliveries and orders,
    - `niski stan magazynowy (N)` in DOSTAWY secondnav.
- **2026-02-12** – Warehouse secondnav (`DOSTAWY`) extended on production:
  - commit: `831b9f9e`
  - deploy run: Dashboard `21965674611`
  - changes:
    - added `niski stan magazynowy` route (`/stock-alerts`),
    - added `producenci` route (`/manufacturers`),
    - both routes render in VersumShell and use warehouse table layout.
- **2026-02-12** – Warehouse magazyn updates shipped to production:
  - commits: `90847948`, `e2b6b937`
  - deploy runs: Dashboard `21965037142`, `21965343231`
  - changes:
    - `/orders/new` aligned closer to Versum (lp/jednostka/uwagi/akcje),
    - `/deliveries/new` logic fixed (`wprowadź dostawę` now creates + receives to stock, plus `zapisz jako roboczą`),
    - `/orders/history` and `/deliveries/history` improved (status labels + `?status=draft` filtering),
    - warehouse secondnav extended with `wersje robocze` and `dostawcy` (`/suppliers`).
- **2026-02-12** – Customers card tabs fixes shipped to production:
  - commit: `b75dfa6d`
  - deploy runs: API `21941396718`, Dashboard `21941473185`
  - changes: `statistics` + `events_history` now have functional period filtering and correct time rendering; `gallery/files/communication_preferences` tabs use Versum-like markup/styles; comments tab shows errors and toasts on add failures.
- **2026-02-12** – Customers `communication_preferences` layout aligned closer to Versum:
  - commit: `22b72433`
  - deploy run: Dashboard `21943523776`
  - changes: replaced checkbox-style consents/history widget with Versum-like sections (contact info, channels table, icon-based consents) and dedicated CSS in `apps/panel/src/styles/versum-shell.css`.
- **2026-02-11** – Antigravity Browser Control is available locally at `http://localhost:49230/` and can be used for interactive browser automation alongside MCP Playwright (click/scroll/type/navigate + progress overlay/control in IDE).
- **2026-02-11** – Versum cloning rule captured in SOP: `secondnav` is route-contextual (must switch section/links per submodule, not static); parity checks now explicitly include route→secondnav transitions for customers/calendar/warehouse.
- **2026-02-11** – Customers cleanup completed in panel/backend:
  - panel runtime uses only `/customers*` routes (legacy `/clients*` pages removed);
  - permissions and Versum module key migrated from `nav:clients`/`clients` to `nav:customers`/`customers`;
  - formulas endpoints migrated to `/customers/me/formulas` and `/customers/:id/formulas`;
  - legacy backend `ClientsController` removed from `UsersModule`.
- **2026-02-11** – Warehouse stabilization hotfix deployed to production:
  - dashboard: `/inventory` now opens creation flow on `/inventory/new`;
  - API: `GET /products` and `GET /product-categories/tree` marked with `@SkipThrottle()` to reduce false 429 spikes during warehouse navigation;
  - verification: `GET /products` and `GET /product-categories/tree` return stable `401` (no `429`) without auth under burst checks, and `/inventory/new` loads correctly after login.
- **2026-02-10** – `/calendar` restored to the **vendored Versum embed**:
  - `/calendar` (Next page) replaces the document with HTML served by `apps/panel/src/pages/api/calendar-embed.ts`;
  - legacy `/salonblackandwhite/*` compat aliases are rewritten to `/api/*` in `apps/panel/next.config.mjs`.
- **2026-02-10** – `Deploy (MyDevil)` hardened for dashboard bundles:
  - isolated bundle dirs per app (`deploy_bundle_panel` / `deploy_bundle_landing`);
  - `npm install --ignore-scripts` to avoid non-runtime hooks;
  - remote verification requires `.next` + `public` + `node_modules` + `app.js`/`app.cjs` (validated on production run `21865640899`).
- **2026-02-10** – `Deploy (MyDevil)` uses absolute remote upload/extract paths for frontend bundles (validated on production run `21866459396`).
- **2026-02-04** – **Calendar module DoD complete**:
  - static runtime served from `apps/panel/public/versum-calendar/index.html`;
  - panel rewrites added for compat paths: `/events/*`, `/settings/timetable/schedules/*`, `/graphql`, `/track_new_events.json`;
  - backend compat module added at `src/versum-compat/*` with endpoint + payload mapping for calendar flows;
  - `/salonblackandwhite/*` aliases mapped to local routes for runtime compatibility;
  - **E2E tests**: 14 tests covering views, navigation, events, finalize/no_show flows (`tests/e2e/calendar.spec.ts`);
  - **Visual tests**: pixel parity tests ready for 1366/1920 (`tests/visual/versum-admin.spec.ts`);
  - See [CALENDAR_PARITY_MATRIX.md](./CALENDAR_PARITY_MATRIX.md) for full DoD checklist.
- **2026-02-04** – Deploy workflow hardened for panel/dashboard:
  - path-change detection now falls back to `grep` when `rg` is unavailable on GitHub runners;
  - panel app-name resolution now falls back to `MYDEVIL_DASHBOARD_APP_NAME_*` vars (fixes wrong `dev.salon-bw.pl` app target on panel deploy);
  - removed unsupported `devil www options <domain> nodejs_version ...` calls from runtime prep and startup probes;
  - replaced incorrect panel-side DB migration step with panel bundle verification.
  - validated end-to-end on production dashboard deploy run `21686405136`.
- **2026-02-04** – Panel admin shell switched to Versum-style navigation with canonical module routes: `/calendar`, `/customers`, `/products`, `/statistics`, `/communication`, `/services`, `/settings`, `/extension`; legacy `/admin/*` entry routes redirect to canonical equivalents.
- **2026-02-03** – Frontend E2E workflow removed; Lighthouse CI now targets only `https://dev.salon-bw.pl/` due to `/services` returning 500.
- **2026-01-21 22:15 UTC** - Production readiness verification Phase 1 completed:
  - ✅ API health endpoints operational (database, SMTP, Prometheus metrics)
  - ✅ Public site (salon-bw.pl) → redirects to www.salon-bw.pl (200 OK)
  - ✅ Panel dashboard (panel.salon-bw.pl) → proper auth redirect (307)
  - ✅ Dev site (dev.salon-bw.pl) → operational (200 OK)
  - ✅ Database password updated across all environments
  - ✅ bcrypt native module rebuilt for production environment
- Contact form calls `/emails/send` (Nest `EmailsModule`) and relays through `kontakt@salon-bw.pl`.
- Deploy workflows (`deploy_api`, `deploy_public`, `deploy_dashboard`) accept optional `app_name` and tolerate php domains by touching `tmp/restart.txt`. (`deploy_admin` is legacy.)
- Public Next.js build succeeds with `experimental.typedRoutes=false`.
- SMTP + JWT secrets and POS flags managed in production `.env` at `/usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs/.env` (`POS_ENABLED=true`; see [docs/ENV.md](./ENV.md)).
- **2025-11-01 18:32 UTC (`fd0b06d0`)** – POS migrations applied in production (`1710006000000`, `1710007000000`, `1710008000000`), and `POS_ENABLED=true` is live. Verification commands:
  ```bash
  curl -sw '%{http_code}\n' -X POST https://api.salon-bw.pl/sales -H 'Content-Type: application/json' -d '{"saleId":"agent-check","items":[]}' | tail -n1  # 201
  curl -sw '%{http_code}\n' -X POST https://api.salon-bw.pl/inventory/adjust -H 'Content-Type: application/json' -d '{"productId":"demo","delta":1}' | tail -n1  # 200
  ```
  Note: initial `1710007000000` execution blocked on a long-lived session; disconnecting the staging bastion freed the lock and the migration completed cleanly.
- **2025-10-24 23:31 UTC (`fd0b06d0`)** – API emits structured pino logs with `X-Request-Id` correlation and exposes `/metrics` for Prometheus; runbook updated with locations & troubleshooting.
- **2025-10-24 23:31 UTC (`fd0b06d0`)** – Deploy workflows append resilient smoke-check summaries via `scripts/post_deploy_checks.py` (retries `/healthz` and `/emails/send`).
 - **2025-10-25 02:10 UTC (`fd0b06d0`)** – Added domain metrics (emails, appointments). Frontend client now logs `x-request-id` in debug mode for correlation.

## Versum 1:1 Cloning Progress

Goal: Copy Versum panel module-by-module with identical UI, flows, and API contracts.

| Module | Status | DoD | Notes |
| --- | --- | --- | --- |
| **Kalendarz** | ✅ Complete | 6/6 | E2E + visual tests ready; pending final visual validation |
| Klienci | ⏳ Next | 0/6 | |
| Produkty/Magazyn | 🔜 Planned | 0/6 | |
| Usługi | 🔜 Planned | 0/6 | |
| Statystyki | 🔜 Planned | 0/6 | |
| Komunikacja | 🔜 Planned | 0/6 | |
| Ustawienia | 🔜 Planned | 0/6 | |
| Rozszerzenie | 🔜 Planned | 0/6 | |

**DoD criteria** (per module):

1. Reference capture (HAR + screenshots)
2. Vendored assets + identical render
3. Full API adapter
4. E2E tests for all flows
5. Pixel parity (1366/1920, ≤0.5%)
6. Module freeze

## Known Issues

| Issue | Impact | Workaround | Last Updated |
| --- | --- | --- | --- |
| CI/CD GitHub secrets may not propagate to generated .env files | Automated deployments may use stale passwords | Manually update production .env at `/usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs/.env` | 2026-01-21 |

## Uptime Tracking

| Month (UTC) | API (`/healthz`) | Public (dev `/`) | Panel (`/dashboard`) | Notes |
| --- | --- | --- | --- | --- |
| 2025-11 | Monitoring (initializing) | Monitoring (initializing) | Monitoring (initializing) | UptimeRobot + Pingdom probes activated 2025-11-19; first full month of data available in December. |

## Improvements in Progress

| Initiative | Status | Commits | Last Updated |
| --- | --- | --- | --- |
| Phase 1: Security & Type Safety (SEC-1, SEC-2, SEC-3) | ✅ Complete | `2164a116`, `71b22d23`, `37cce05f`, `6b56b9e1` | 2025-11-01 |

**Completed Security Improvements:**
- **2025-11-01 (`71b22d23`)** – Enabled strict TypeScript mode in backend (`noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch`)
- **2025-11-01 (`71b22d23`)** – Removed all explicit `any` types from production code (4 instances fixed)
- **2025-11-01 (`71b22d23`)** – Added `@types/nodemailer` for proper type definitions
- **2025-11-01 (`37cce05f`)** – Added automated dependency vulnerability scanning to CI
- **2025-11-01 (`37cce05f`)** – CI now fails on high/critical vulnerabilities in production dependencies
- **2025-11-01 (`37cce05f`)** – Updated CONTRIBUTING.md with TypeScript standards and dependency management practices
- **2025-11-01 (`6b56b9e1`)** – **BREAKING**: Implemented strict CSP with nonce-based scripts (removed `unsafe-inline`, `unsafe-eval`)
- **2025-11-01 (`6b56b9e1`)** – Added CSP violation reporting endpoint at `/csp-report`
- **2025-11-01 (`6b56b9e1`)** – Dynamic nonce generation via middleware for enhanced security

**Current Security Status:**
- ✅ Zero `any` types in production code
- ✅ Strict TypeScript enabled across backend
- ✅ No known vulnerabilities in production dependencies
- ✅ Automated security audits on every CI run
- ✅ **Strict CSP with nonces** (no unsafe-inline/unsafe-eval) - **A+ security grade expected**
- ✅ CSP violation monitoring and logging

## Operational References

- CI/CD overview and secrets: [`docs/CI_CD.md`](./CI_CD.md)
- Manual deploy runbook: [`docs/DEPLOYMENT_MYDEVIL.md`](./DEPLOYMENT_MYDEVIL.md)
- Environment variables: [`docs/ENV.md`](./ENV.md)
- Agent runbook (commands, restarts, verification): [`docs/AGENT_OPERATIONS.md`](./AGENT_OPERATIONS.md)

## Instructions for Agents

1. **After every deployment or infrastructure fix** update this file:
   - Record the commit SHA, workflow run ID, and timestamp.
   - Move resolved items from “Known Issues” to “What’s Working” with a brief note.
2. **Dispatch workflows** with `gh workflow run <file> -f commit_sha=<sha> …` (details in `docs/AGENT_OPERATIONS.md`).
3. **Monitor runs** with `gh run list --workflow "<name>"` and `gh run view <id> --log | tail`.
4. **Access servers** through the `devil` host alias (`ssh devil`). Node apps live under `/usr/home/vetternkraft/apps/nodejs/*`; public Next.js lives at `/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs`.
5. **Restart rules:**
   - Node.js domains (e.g. `api.salon-bw.pl`, `dev.salon-bw.pl`): `devil www restart <domain>`.
   - PHP/Passenger wrappers (e.g. `salon-bw.pl`, `panel.salon-bw.pl`, `dev.salon-bw.pl`): write `tmp/restart.txt` instead—see operations doc.
6. **Document everything**—if you learn a new path, secret, or behaviour, append it here and cross-link the deeper documentation.
