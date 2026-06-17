# Active Context

## Agent workflow rules

- **MANDATORY:** After every significant change, immediately update this file with: what was done, what was found, what is next.
- **MANDATORY:** Add findings/blockers to the Backlog section below as soon as they are discovered.
- **MANDATORY:** Do NOT defer documentation to end-of-session — update incrementally after each commit.
- Every session should leave this file more accurate than it found it.
- When handing off: verify the "In-progress work" branch hash matches HEAD on master.

---

## Current focus

- **Full-session sprint — COMPLETE (2026-06-08/09)** (commits `ea63309b`–`9c875628`, master `3b1d03f5`)
  See `docs/IMPLEMENTATION_BACKLOG_STATUS.md` for full per-phase details. Summary:

  **Phase 0 — Feature hardening:**
  - `'use client'` removed from all 73 Pages Router components (was causing SSR issues; Pages Router doesn't use this directive)
  - All `window.alert()` → toast notifications (15 sites)
  - All `window.confirm()` / `window.prompt()` → `ConfirmModal` + custom modal
  - Error handling rollout: every mutation in panel has `onError` toast handler — no silent failures
  - Polish-only UI: all English strings translated across panel and landing
  - Bulk delete for services and products (with checkboxes)
  - TimeBlockModal for calendar time blocks
  - Commission base rate editor + display
  - Delivery row-level receive/cancel actions
  - Recipe tab on service detail; delete button on product detail
  - `/settings/customer-origins`, `/settings/data-protection` pages added
  - Account page: profile section added; API module English toasts removed
  - `rel="noopener noreferrer"` on all `target="_blank"` links

  **Phase 1 — a11y: Interactive elements:**
  - `href="#"` / `javascript:;` → `<button type="button">` everywhere
  - `type="button"` added to 56+ buttons missing it (prevents form submission)
  - SalonBreadcrumbs: `<nav aria-label="Nawigacja">` + `aria-current="page"`

  **Phase 2 — a11y + SEO: Titles + meta:**
  - Page-specific `<title>` on ALL 44+ panel pages; default fallback in `_app.tsx`
  - Custom 404 page for panel
  - Full OG/Twitter/JSON-LD meta on all landing pages; `og:locale=pl_PL`, dimensions, canonical with `absUrl()`
  - `theme-color` + Twitter card; JSON-LD Organization schema (services, gallery, contact)
  - Missing `<meta name="viewport">` fix in landing

  **Phase 3 — a11y: Form semantics:**
  - `htmlFor`/`id` linkage on ALL labels across all modals and forms
  - `aria-label` on all icon-only buttons and controls without visible labels
  - `aria-hidden="true"` on 25+ decorative icons (FontAwesome + SVGs)
  - `role="alert"` / `role="status"` on error/warning/success messages
  - `aria-describedby` on hint-associated inputs
  - `autoComplete` attributes on customer form inputs

  **Phase 4 — a11y: Modal dialogs + nav:**
  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on ALL modals (3 batches)
  - Focus trap + ESC handler + focus restoration on close

  **Phase 5 — a11y: Tables + pagination + nav:**
  - `scope="col"` on ALL `<th>` in panel
  - Pagination: `<nav aria-label="Paginacja">` on all paginated pages
  - `aria-current="page"` on active nav items in ALL navigation components
  - Non-interactive `<a>` → `<span>`; `<a onClick>` → `role="button"` + keyboard nav

  **Phase 6 — Route integrity + calendar:**
  - Legacy rewrites fixed; time-block validation hardened; calendar overlap queries fixed

- **Bootstrap 5 migration — COMPLETE (2026-03-27)**
- **Faza E — Versum visual parity sprint — COMPLETE (2026-05-24)**
- **Core booking/appointment flow — COMPLETE (2026-05-24)**
  - Client booking wizard `/booking` (3-step: service → slot → confirm) — implemented
  - `online_pending` + `rescheduled_pending` statuses — API + DB migration + UI
  - Available slots endpoint `GET /calendar/available-slots` — implemented
  - Formula service bug fixed (admin 403 + confirmed-status 400)
  - FinalizationModal: usageMaterials (from recipe) + usageItems (manual) + deduction — all wired
  - AppointmentDrawer: formula UI, internalNote, client contact (tel:/mailto:), visit history
  - Online pending badge in topbar — implemented
- **Dead code cleanup — COMPLETE (2026-05-25)** (PR #1352)

---

## In-progress work

- Branch: master (latest commit `0fb490ec3` — Phase 0 landing simplification)
- Panel production: `64abb87ad` content — DEPLOYED 2026-06-10 (strict CSP without unsafe-eval verified on prod)
- Landing production: `0fb490ec3` — DEPLOYED 2026-06-10 (run `27282009631`, success; verified: ticker gone, stats strip + MapFacade + reveal-item live)
- **Landing modernization plan (Fazy 0–4)**: Faza 0 DONE (home 10→8 sections, strips consolidated, CTAs reduced, content-visible reveals, map facade; Lighthouse mobile 100×4). Faza 1 DONE 2026-06-10 (`7dc36d1d5`): Consent Mode v2 basic — gtag mounts only post-consent, CookieConsent banner pl/en/de, _ga* cleanup on decline, 4-case test suite; verified live in prod bundle (`sbw-consent` in _app chunk). **FINDING: CI never injects NEXT_PUBLIC_GA_ID/ENABLE_ANALYTICS → prod analytics was and is OFF; banner appears only once owner provides a GA4 id to the deploy build env.** Faza 2 DONE 2026-06-10 (`23bf257c4` + redeploys `27299302570`/`27299559832`): perf trace mobile Fast-4G 4xCPU → LCP 397ms, TTFB 26ms, CLS 0.00 (all "good"); root fix = deploy no longer hard-copies .next/static into public/_next, so Node serves /_next/static with `immutable` (was TTL 0 via nginx bypass — every visit re-downloaded all JS/CSS/fonts on BOTH frontends). Known limitation (P3): /images/* still nginx-served with no Cache-Control (etag/304 revalidation only) — would need image-optimizer routing or MyDevil nginx config. Faza 3 DONE 2026-06-10 (`33425440c`, deploy `27302862108`): public anonymized `GET /calendar/nearest-slot` (no auth by design — single timestamp only, Throttler-limited, 2-min cache, +1h floor, 14-day scan over shortest active service) + hero teaser 'Najbliższy wolny termin: czw., 11 cze, 09:00' (verified live, pl/en/de, hides on error) + HairSalon JSON-LD aggregateRating 5.0/4 reviews from on-page testimonials (verified in prod DOM). FAQPage schema skipped on purpose — no FAQ content on site, schema without visible content violates Google guidelines. **MVP Booking runbook** (`docs/MVP_BOOKING_RUNBOOK.md`): Dzień 1 (L1 sloty×godziny pracy) DONE 2026-06-10 `aa66337d4` — API live, fallback pon–sob 9–19/niedziela zamknięta do czasu wpisania realnych godzin w panelu (Dzień 3). Dzień 1b DONE 2026-06-10 (`4df90ca35`): godziny salonu dynamicznie z grafiku pracownika — precedencja w slotach (grafik wygrywa nad branchem, zaplanowana niedziela bookowalna), publiczny `GET /calendar/opening-hours` (unia grafików), landing renderuje godziny live na 5 powierzchniach (hero/footer/navbar/kontakt×2) ze statycznym fallbackiem; prod zweryfikowany: „Pn–So 09:00 - 17:00" z realnego timetable. Known drift: JSON-LD openingHours statyczne. CI: backend smoke retry rozszerzony (`9e3a9584c`, 8×capped-backoff) po drugim false-fail na oknie 403 Passengera. Dzień 2 DONE 2026-06-11 (`2ab5af17e`, deploy `27309782335` success): L2 e-mail do salonu przy samodzielnej rezerwacji klientki (EmailsService, odbiorca BOOKING_ALERT_EMAIL default kontakt@salon-bw.pl, treść PL z linkiem do panelu, błąd wysyłki nie blokuje rezerwacji, wpis w email_logs; WhatsApp do pracownika zostaje drugim kanałem). L3 WYCOFANA — audyt: usePendingBookingsCount polluje refetchInterval=2min od zawsze, runbook się mylił. Testy 234/234. Next: Dzień 3 = konfiguracja danych przez właścicieli (usługi, konto pracownika, grafik — godziny brancha już zbędne), Dzień 4 = E2E (w tym pierwszy realny test maila L2). Faza 4 landing (optional polish) = view transitions, dark-mode var audit, bento grid
- **Landing IA alignment to LANDING_DESIGN_DIRECTION DONE 2026-06-14** (`8b88796c1` footer, `4ce08dc60` home): owner felt landing "miał inaczej wyglądać". **Key infra fact (re)confirmed: the modern landing only deploys to `dev.salon-bw.pl` (CI var `MYDEVIL_PUBLIC_APP_NAME`=dev); the public `salon-bw.pl` is a SEPARATE legacy non-Next site that CI never touches — intentional, not yet cut over (owner: stary salon-bw.pl zostaje, landing testujemy na dev).** Per the design doc cut from home: removed `TrustStrip` (stats 15/3000/4.9/30 + partner-brand strip on warm-cream — the main "over-designed/try-hard" signal), trimmed `AboutSpread` to a short founder note (dropped 3-principles grid), removed the duplicated opening-hours block from the footer (hours live in the Kontakt section + /contact; footer now clean 2-col). Testimonials KEPT (already adjacent to gallery + the on-page reviews back the HairSalon `aggregateRating` JSON-LD — removing them would orphan the schema like the FAQ case). PartnerBrands marquee NOT reintroduced (motion anti-pattern); optional follow-up = static brand strip on /services. Verified live on dev (desktop+390 mobile: no beige strip, no h-scroll; HTML: TrustStrip aria-label absent, footer "Godziny" label gone). Remaining doc items not done (owner decision): hero floating-card hours still present on mobile, cennik widełkowy on /services, multilingual cut-vs-translate, palette A(true mono) vs B(warm-as-name).
- **Project skill `.claude/skills/salonbw-brand/`** (versioned) — B&W design tokens, contrast table, motion/CTA rules; load for any UI work
- API production: `3a6ad7d77` — DEPLOYED 2026-06-10 (dispatch run `27266949144`, success; migrations ran; verified: healthz ok, /calendar/available-slots returns 401 not 404)
- **Dzień 3 (dane Booksy) DONE 2026-06-14** — Versum+Booksy wyłączone; właściciel dał wsad z Booksy (zrzut grafiku Aleksandry + PDF cennika). Zaimplementowane migracjami (API prod, HEAD `8c6cf004f`):
  - `1760980000000-SeedBooksyCatalogAndHours` — 4 kategorie + 60 płaskich usług (27 rodziców Booksy × warianty długości włosów; booking nie ma pickera wariantów, więc każdy wariant = osobny Service z własnym czasem/ceną), przypisane do Aleksandry, `onlineBooking=on`; placeholder-grafik 9–17 podmieniony na realny (Pon 9–16, Wt 12–19, Śr wolne, Czw 12–19, Pt 9–16, So 9–13, Nd wolne).
  - `1760990000000-CleanupLegacyServicesBooksyOnly` — ~64 stare usługi sprzed Booksy (duplikaty „X"/„X Ola", literówki) → `onlineBooking=false` (zostają isActive do historii/statystyk, do włączenia w panelu); kanonizacja 60 (naprawa 12 kolizji nazw: Fryzura ślubna 150→280, Olaplex 30→60min).
  - `1761000000000-DedupeBookingServices` — legacy miał zduplikowane nazwy → window `row_number()` zostawia min(id) per nazwa bookowalny (zachowuje linki historyczne), resztę hide.
  - **Zweryfikowane live:** `/services/public` onlineBooking=true = **dokładnie 60** (27/21/10/2), zero dup nazw; `/calendar/opening-hours` = realny grafik; healthz ok.
  - Landing (`5053defbb`, deploy run `27477653998`): JSON-LD `openingHoursSpecification` (index+contact) + `BUSINESS_INFO.hours` fallback dopasowane do realnego grafiku (Pon+Pt 9–16, Wt+Czw 12–19, So 9–13). **Known drift JSON-LD openingHours — RESOLVED.**
  - **NOWY DŁUG CI (do naprawy):** krok „Run DB migrations" w deploy.yml = `node dist/src/migrate.js || node dist/migrate.js`; gdy primary padnie (exit 1), `||` odpala fallback `dist/migrate.js`, który kończy 0 → deploy fałszywie „success", maskuje błąd migracji (pierwszy seed `inconsistent types deduced for parameter $1` przeszedł jako success, dane się nie zapisały). Fix: `if [ -f dist/src/migrate.js ]; then …; else …; fi` zamiast `||`.
  - Lekcja: idempotencja-po-nazwie na brudnym katalogu (duplikaty, kolizje) jest zawodna — patrz pamięć [[seed-migration-dirty-catalog]].
- **Dzień 4 (E2E na prod) DONE 2026-06-14** — pełny happy-path przeszedł na żywo, sterowany przez API (cookie jar + `X-XSRF-TOKEN`; CSRF middleware obejmuje wszystkie POST `forRoutes('*')` poza listą, nie zwalnia Bearera; login zwraca `access_token` w body + cookies):
  - Rejestracja klienta (`/auth/register`, tylko rola Client) → `/services/online-booking` zwraca **60** pogrupowane → `/calendar/available-slots` realny grafik (Pon 14 slotów 9:00–15:30) → POST `/appointments` → `online_pending` (#29) → **mail L2 WYSŁANY** (`email_logs`: kontakt@salon-bw.pl, „Nowa rezerwacja online — 2026-06-15 13:30", status sent) → admin PATCH `/appointments/29/status confirmed` → POST `/29/finalize` (cash 3000 gr) → `completed` → konflikt: ponowna rezerwacja tego slotu = **409 „Employee is already booked for this time"**.
  - Pierwszy realny test L2 = ✅ (potwierdzony w email_logs, nie tylko unit-mock).
  - Konta uprzywilejowane: rejestracja daje tylko Client, więc admin/employee przez migrację `1761010000000-CreateE2eTestAccounts` (bcrypt hash w pliku, hasła poza repo). **users.role to natywny enum `users_role_enum`** (NIE varchar jak priceType) → INSERT wymaga `$n::"users_role_enum"`.
  - **Potwierdzenie, że fix `migrate.js` działa:** gdy ta migracja miała błąd (enum), deploy POPRAWNIE padł (exit 1) zamiast zamaskować — wcześniejszy `|| fallback` by to ukrył.
  - Sprzątanie (brak DELETE w API → migracje): `1761020000000-CleanupE2eTestArtifacts` (appt #29 + dzieci + log L2 + 3 konta e2e) i `1761030000000-CleanupVerificationAccount` (throwaway vcheck.*). Wzorzec: dynamiczny `DO`-block po `information_schema` (tylko BASE TABLE) — odporny na FK RESTRICT, bez hardkodowania nazw tabel. Zweryfikowane live: e2e.admin login=401, slot 15.06 13:30 wolny, katalog=60.
  - Lekcja zapisana: [[e2e-flow-driving-via-api]] (CSRF/enum/cleanup-via-migration).
- MVP booking — **wszystkie 4 dni DONE**. Pozostałe drobne: konto pracownicze Aleksandry (id 29) działa (ma usługi + grafik, dostaje rezerwacje); WhatsApp do klienta wysyłany przy confirm (nie zweryfikowany na realnym numerze — testowy był fałszywy).

---

## Backlog — open findings / next tasks

### P1 — Blockers
- _(none open)_
- ~~API deploy needed~~ — DONE 2026-06-10: dispatch run `27266949144` (success) shipped API at `3a6ad7d77` with online_pending migration, available-slots endpoint, formula fix; healthz verified ok
- ~~Panel redeploy needed~~ — DONE 2026-06-10: push deploy `27266421553` shipped panel + landing at `21efc2459`

### P2 — Accessibility (remaining — all other a11y DONE in full-session sprint)
- ~~Color contrast audit~~ — DONE 2026-06-10 (`2b57d0c12`, `64abb87ad`): Lighthouse run on landing (/, /services, /contact, /gallery, /services/balayage) + panel /auth/login — all now score a11y 100. Fixed: white-on-silver CTA → dark-on-silver; new `--brand-silver-ink` (#6e7278) for silver text on light bg; `--brand-warm-label` darkened; low-alpha white text on dark raised to 0.55; slider dots got 24px touch targets; login got `<main>` landmark. Panel authenticated pages NOT audited (needs logged-in Lighthouse run — follow-up if desired)
- ~~Toast aria-live~~ — DONE 2026-06-10 (`4d016e554`): error toasts now `role=alert` + `aria-live=assertive`; success keeps react-hot-toast default polite status
- ~~Landing image alt text~~ — AUDITED 2026-06-10, no gaps: all content images have descriptive Polish alts in `content.ts`; decorative bg images (BookingCta, ServicesTeaser) correctly use `alt=""` + `aria-hidden`
- ~~Focus-ring CSS audit~~ — AUDITED 2026-06-10, no gaps: every `outline: none` in salon-shell.css pairs with border-color + box-shadow focus style; global `:focus-visible` rule (line ~8247) gives 2px accent outline to buttons/links/tabindex

### P3 — Code quality
- `data_protection.tsx`: `inner edit_branch_form` on a `<form>` — refactor deferred
- `DashboardLayout` exists but used by no page — dead code; safe to remove
- ~~Push-triggered CI deploy runs failing~~ — stale: push deploy `27266421553` (2026-06-10) succeeded end-to-end
- Dead CSS audit: `default.css` / `new-ui.css` chunks to remove — not yet started

---

## Recent decisions

- **Service-category management page built 2026-06-17** (`57afb6a05`, panel) — page-by-page completeness pass (owner: unified layout/design/UX, complete functions). Found: backend `/service-categories` had full CRUD + the panel hooks existed (`useCreate/Update/DeleteServiceCategory` in useServicesAdmin), services assignable to a category in the service form, and landing+booking already group by category — but there was NO panel UI to add/edit/delete service categories (only product categories had `/settings/categories`). Built `/settings/service-categories.tsx` (list with per-category active-service counts, add/edit via Bootstrap-utility modal matching ConfirmModal, delete with confirm), added to SettingsNav ("Kategorie usług" + relabeled the product one to "Kategorie produktów"), fixed the product page's mislabeled `<title>`. Verified live full CRUD (create→list refresh→delete→confirm, no residue); counts 27/21/10/2 = 60 match the catalog. NOTE: reorder hook exists (`useReorderCategories`) but the page doesn't expose drag-reorder yet (flat 4-category list; add if needed). Remaining modules to sweep next: service detail tabs (recipe/commissions/employees/history), customer detail tabs, settings pages, per-role dashboard.
- **Panel UI/UX sweep (admin modules) 2026-06-17** — reviewed magazyn/statystyki/łączność live. Fixes deployed: (1) sidebar `.nav-list` carried Bootstrap `.nav` (display:flex row) so multi-item groups ran together (communication KAMPANIE: "Wiadomości masoweNewslettery") → forced `flex-direction:column` (`07d69d5d7`). (2) statistics charts used a bright Versum palette (green #88ca2a / blue / orange / purple) → recolored ALL chart hexes across 9 statistics files to a monochrome black→silver brand scale (`#0d0d0d`/`#6e7278`/`#9a9ea4`/`#3a3d42`/`#c4c8ce`/`#54585e`/`#87898f`); each source hue→distinct gray so no within-chart collision; text-stat colors use silver-ink #6e7278 (AA). Verified live: payment pie now black, not green (`5015ef19e`). Owner chose full monochrome over muted-accent. Non-issues confirmed: communication "Ładowanie wiadomości…" resolves to "Brak wiadomości" (not stuck); magazyn "0 mililitry (0 ml)" redundant unit is backend-formatted (left). Deploy note: the nav-fix run failed at the flaky backend smoke-test (403 warm-up) AFTER panel deployed; the chart run on top succeeded and carries both.
- **Data-sourcing audit (owner: "wszystko z bazy — config + robocze") DONE 2026-06-17** (`b0ffb755c`). Swept panel for hardcoded/mock business data. Result: all operational entities (customers/products/employees/services/appointments) AND config (categories, customer-origins, settings/salon/hours/payment-config, data-protection) are DB-backed via API; NO hardcoded salon contact/hours/mock arrays in the panel. Two picker consistency fixes (sourced-but-unfiltered, like the services case): service picker now `useActiveServices()`→`/services?isActive=true`; FinalizationModal product picker now `/products?isActive=true` (sales/new already used `includeInactive:false`). Genuinely-hardcoded (flagged, NOT operational): the `/extension` (dodatki) marketplace catalog — `TOOLS`/`PLANS`/`cards` consts in `pages/extension/*` are a static Versum-clone upsell page. Borderline-but-standard: payment-method options (cash/card/transfer) in `pages/sales/new.tsx` mirror a backend enum. Observation: warehouse has 821 active products (all isActive, no inactive pollution) — worth a real-vs-legacy look but not a sourcing issue.
- **Landing warm-cream → neutral B&W migration DONE + DEPLOYED 2026-06-16** (`76dc2a147`, dev landing): the `--brand-warm-*` tokens (warm-brown text on `#faf9f7` cream) were owner-flagged migration debt. Redefined the token VALUES in `globals.css` to a neutral cool-gray scale (bg `#f6f6f7`, text `#23252a`/`#5f6369`) so every consumer migrates at once; fixed the one hardcoded `#ede9e3` border in ValuesSection. Contrast re-verified (≥5.5:1 on `#f6f6f7`). Live tokens confirmed via computed style. Brand skill (`salonbw-brand/SKILL.md`) updated so "warm-cream" no longer reads as legacy-approved-keep.
- **Calendar review (3 roles) DONE + DEPLOYED 2026-06-17** (`5a263586b`, api+panel): walked /calendar as admin/employee/client. Findings + fixes: (1) 🔴 the "Nowa wizyta" service dropdown (shared `AppointmentDrawer`, admin+employee) listed all 165 services incl. pre-Booksy legacy dups/typos ("Rozjasnienie globalne wlosow Ola", "…Ola", "Farbowanie Koleston Perfect") because it maps unfiltered `/services` while booking uses `/services/online-booking`. Fix = migration `1761070000000` deactivates the legacy set (`isActive=false WHERE onlineBooking=false`) + drawer filters `isActive!==false` (keeps an existing visit's service visible). Verified live: active services 60 (was polluting with 81 now-inactive), dropdown shows clean 60. (2) ⚠️ client hitting /calendar → RouteGuard `Forbidden` page was English ("You don't have permission…") → translated to "Nie masz uprawnień, aby wyświetlić tę sekcję." (test updated). (3) ✅ confirmed B2 live: employee PRACOWNICY filter now populated; client correctly blocked. Retracted as non-bugs: header "00:00"/midnight = live clock + "default to now" (it was past midnight).
- **Multi-role panel UX/UI review DONE 2026-06-16** (live on prod, all 3 roles via test.admin@/test.ola@/test.klient@). Findings + fixes:
  - 🔴 **Employee "Mój grafik" was broken** — `GET /employees/:id` + `/employees/staff-options` were Admin-only → 403 → "Nie udało się pobrać grafiku". Calendar PRACOWNICY filter also empty (`GET /employees` 403). FIX (`employees.controller.ts`): opened the 3 GET endpoints to Admin+Employee+Receptionist; `:id` ForbiddenException unless admin OR own id; non-admins get PII-sanitized `toStaffView()` ({id,name,role,full/first/lastName}, NO email/phone/commissionBase); admin keeps full record. See memory [[salonbw-employee-self-read]] (id 1fb4e41d).
  - ⚠️ **B3 settings nav leaked to employee** — persistent shell auto-resolver (`SalonSecondaryNav`) renders `<SettingsNav/>` for any /settings/* route regardless of role, overriding the page's `useSetSecondaryNav(null)` (SalonShell falls back to auto when context nav is null). FIX: `SalonSecondaryNav` now returns null for `settings` module when `role!=='admin'`. (Was cosmetic — RouteGuard already blocked access.)
  - 🗑️ **A1 data pollution** — every staff/customer list was full of QA/automation junk (Browser Validator, Curl/Cypress/E2E/Final/QA/Test accounts). Migration `1761060000000-CleanupTestQaAccounts` deletes 27 junk `users` (staff 13,17,30,31,34,40,41,42 + ~19 customers), merges duplicate Marzena 12→10, KEEPS Aleksandra(29)+active test trio(47,48,49). Owner approved deleting even owner-domain accounts (admin@/kontakt@bodora.pl/gniewko@bodora.pl). Uses dynamic information_schema FK scan (repoint-then-delete; RESTRICT-safe; validated on pg16 container: keepers survive, junk appts/reviews removed, dangling created_by nulled). down()=no-op (irreversible; audit list embedded in migration).
  - **DEPLOYED + VERIFIED live 2026-06-16** (api `8d0d57f59`, panel build `XPbQvYT5szyy8fUZlAxcl`): Ola GET /employees/48 own=200 sanitized, /47=403; /timetables=200; "Mój grafik" page renders (month grid + edytuj grafik, no error); settings nav hidden for employee (only kalendarz+klienci in rail); staff list=3, customers=2 (Marzena merged). Root-cause of the schedule bug was the JWT user shape `{userId,role}` (no `.id`) — `jwt.strategy` now also returns `id` so `actor.id` resolves codebase-wide (also fixes timetable assertCanManage so employees can SAVE their own schedule). Deploy note: the FIRST attempt failed at the migration step (commit `887c4e7e8`) AFTER the panel bundle had uploaded → panel served HTML for a build whose _next chunks 404'd (blank for everyone); fixed by a clean `target=panel` dispatch. Migration needed 2 fixes before it passed: (1) merge unique-collision on customer_tag_assignments → savepoint+drop-dup, (2) grandchild FK (commissions→appointments) → recursive `pg_temp.cleanup_cascade_del`. See memories [[salonbw-employee-self-read]], [[salonbw-deploy-partial-panel-build-mismatch]].
  - **Cosmetic polish DONE + DEPLOYED 2026-06-16** (panel build `RyPtOYZcu49648Qot82nt`+`697c0c0a0`, verified live): (1) admin filter sidebars (customers GRUPY KLIENTÓW / WYBIERZ KRYTERIA, services categories) — the Versum `.tree`/`.simple-list` items are `<button>` not `<a>` so they showed UA chrome (bare outlined boxes); added a reset + matched them to the anchor styling, and forced `.list_container .simple-list` to `flex-direction:column` (base `.simple-list` is flex/nowrap for module tabs, which crammed the criteria into columns). (2) client `/booking` resolved to the default calendar module → leaked the staff mini-calendar + empty PRACOWNICY sidebar; added a dedicated `BOOKING_MODULE` (secondaryNav:false, no_sidenav) + `/booking` case in `resolveSalonModule`. (3) booking service cards hide description when it equals the name (Booksy flat services had description==name).
- **`'use client'` prohibition (Pages Router):** Remove from ALL panel components/hooks. Pages Router components are server-renderable by default; `'use client'` is App Router only. Removed from 73 files in this session.
- **Error handling contract:** Every `mutation.mutate()` / `mutation.mutateAsync()` call must have `onError: (err) => toast(...)`. Never log silently. Rolled out across all panel pages in this session.
- **Polish-only UI:** All user-visible strings must be in Polish. No English in buttons, labels, toasts, errors, placeholders. Translated all remaining English strings in this session.
- **`type="button"` required:** All `<button>` elements that are not `type="submit"` must explicitly declare `type="button"`. Untyped buttons inside forms default to submit.
- **No `href="#"` / `javascript:;`:** Use `<button type="button">` for interactive elements that aren't real navigation links.
- **`window.confirm()` / `window.alert()` → ConfirmModal / toast:** Native dialogs inaccessible and unstyled. All replaced in this session.
- **Modal semantics:** All modals require `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (title id) + ESC closes + focus trap + focus restore on close.
- **SEO meta pattern:** Every public landing page needs title, og:title/description/url/image/locale/type, twitter:card, canonical. Services/gallery/contact also get JSON-LD Organization schema. `og:url` and canonical must use absolute URLs via `absUrl()`.
- **Form labels:** Every `<input>`/`<select>`/`<textarea>` must be linked to a `<label>` via `htmlFor`/`id` OR have `aria-label`/`aria-labelledby`. `aria-label` used when no visible label (icon buttons, table row selects).
- **Decorative icons:** `aria-hidden="true"` on all decorative FontAwesome `<i>` and inline SVGs. Icon-only buttons get `aria-label`.
- **Pagination landmark:** Wrap with `<nav aria-label="Paginacja">`. Active page: `aria-current="page"`. Form-based pagination: add `aria-label="Paginacja"` to `<form>`.
- **Nav `aria-current`:** All active nav items across ALL navigation components must have `aria-current="page"` (links) or `aria-current="true"` (filter/group buttons).
- **a11y form toggle:** Clickable `<div>` that shows/hides content → `<button type="button" aria-expanded={bool}>`. Caret icon gets `aria-hidden="true"`.
- **`rel="noopener noreferrer"`:** Required on ALL `target="_blank"` links. Security + performance.
- **a11y — `<form>` pagination:** Can't convert to `<nav>` without breaking form semantics. Add `aria-label="Paginacja"` to the `<form>` instead.
  Evidence: TimetableTemplatesPage and ActivityLogRoute use `<form>` for page navigation
- salonbw-btn → Bootstrap 5 btn btn-* migration: all done; dead CSS removed.
- Formula service: accepts Role.Admin + Confirmed status (was bug: 403 for admin, 400 for confirmed)
- `PanelTable` API: `columns[]` (label?, ariaLabel?, className?), `isEmpty?`, `emptyMessage?`, `children` (tbody rows).
- `PanelSection` API: `title?` (renders h2), `action?` (renders actions div), `children`, `className?`.
  - Use `title` prop only when h2 is at direct top level of section.
  - For form-wrapping pages: replace outer div with PanelSection, leave h2 inside form children — do NOT use `title` prop.
- VersumShell made persistent in `_app.tsx` via nesting-detection pattern.
- Next.js upgraded to 15.5.10 on panel/landing + root pnpm.overrides updated.
- Codex (`gpt-5.3-codex`, `reasoning_effort=low`) known to skip pre-commit lint checks.
  Evidence: commit `0e93a771` had lint errors (no-misused-promises, prettier) — always audit Codex commits with tabular format: Problem | Naprawiony?

---

## Stack reminders

- Panel: Next.js 15.5.10, pnpm, TypeScript, Bootstrap 5.3 (no Tailwind)
- Backend: Node.js, pnpm
- Host: MyDevil (FreeBSD, Passenger)
- CI: GitHub Actions (.github/workflows/deploy.yml)

---

## Versum source of truth

- Offline dump: `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`
- Required reading order (HANDOFF_PANEL_AGENT.md steps 1-9):
  1. HANDOFF_PANEL_AGENT.md
  2. VERSUM_DUMP_ALIGNMENT_2026-03-17.md
  3. IMPLEMENTATION_MATRIX.md
  4. INVENTED_BEHAVIOR.md
  5. VERSUM_CLONING_STANDARD.md
  6. AGENT_EXECUTION_PLAYBOOK.md
  7. ROUTE_INDEX.json
  8. UI_PATTERN_CATALOG.md
  9. DOMAIN_SCHEMA_INVENTORY.md
- DON'T use VERSUM_CLONE_COMPLETE_GUIDE.md — deleted (obsolete Sprint 1 doc)

---

## Panel layout architecture (VersumShell)

### Persistent shell pattern

`_app.tsx` → `PersistentShellWrapper` → `VersumShell` (mounted once, never unmounts for authenticated users).

- Topbar, main nav, secondary nav are persistent — only content and active elements change.
- Individual pages still call `<VersumShell>` internally — the nesting guard makes them transparent pass-throughs.
- `/calendar` is excluded from persistent shell (uses full document replacement via Calendar embed).

### Secondary nav

- **Auto-resolved** (default): `VersumSecondaryNav` reads `router.pathname` and renders the correct nav per module. No action needed in pages.
- **Custom nav** (3 customer pages only): call `useSetSecondaryNav(jsx)` hook **before any early return** in the page component. Do NOT pass `secondaryNav` prop to `<VersumShell>` — the persistent outer shell won't see it.
- Use `useLayoutEffect` (not `useEffect`) for secondary nav push to prevent first-render flicker.

### Rules

- DO call `useSetSecondaryNav` before `if (!role) return null` (Rules of Hooks).
- DON'T pass `secondaryNav` prop to per-page `<VersumShell>` — use the context hook instead.
- DON'T add `/calendar` to persistent shell (document replacement incompatibility).
- `if (!role) return null` guards in pages are harmless but redundant — remove when refactoring.

### Key files

- Persistent shell + PersistentShellWrapper: `apps/panel/src/pages/_app.tsx`
- Shell component: `apps/panel/src/components/salon/SalonShell.tsx`
- Secondary nav context: `apps/panel/src/contexts/SecondaryNavContext.tsx`
- Secondary nav auto-resolution: `apps/panel/src/components/salon/SalonSecondaryNav.tsx`
- Module routing map: `apps/panel/src/components/salon/navigation.ts`
- **Landing/booking polish DONE 2026-06-14** (all on dev landing + panel booking): hero floating hours card removed (`bc50fcb4e`); `/services` cennik widełkowy — flat Booksy services regrouped by concept (name before " – ") → "od {min} zł" (`bc50fcb4e`); `/services` filtered to `onlineBooking!==false` so legacy isActive duplicates stay off the price list (`285caef40`); legacy service_categories deleted, only Booksy 4 remain (`9e2909c79` migration `1761040000000`); category filter chips ("Wszystkie / Fryzjerstwo / Koloryzacja / Pielęgnacja / Przedłużanie") on `/booking` (panel, 60-service list) + `/services` (landing) — brand-styled silver-active chips (`3ed6c8fa9`). Owner decisions captured: hero hours card unneeded, keep 4 categories (no Fryzjerstwo sub-split), palette = B&W + silver/gray accent (brand skill governs, warm-cream = migration debt). **PENDING: full PL/EN/DE translation (`dotłumaczyć wszystko`)** — service detail pages (coloring/balayage/highlights ~10-17 hardcoded PL lines each, partial i18n) + legal pages (policy/privacy 60-80 lines each, ZERO i18n, fully hardcoded PL). Legal machine-translation is risky (owner/lawyer review needed); service+UI strings are safe to translate.
- **Full PL/EN/DE translation DONE 2026-06-14** (owner: „dotłumaczyć wszystko", legal maszynowo z założeniem korekty prawnika): service detail pages (coloring/balayage/highlights) → per-locale `src/i18n/serviceDetail.ts` (eyebrow/h1/lead/items/SEO meta/OG/JSON-LD, og:locale switches); legal pages (/policy, /privacy) → structured per-locale `src/i18n/legalContent.ts` (sections of p + lists with bold lead-ins) rendered by shared `components/LegalArticle.tsx`; EN/DE legal carry an on-page italic notice „PL is the legally binding version — convenience translation pending review". /services filter chip labels → `SERVICE_FILTER` locale map. Verified live on dev: /policy switches PL↔EN with review notice + preserved structure. Commits `a4d0a7fe0` (services), `fd13ed4a0` (legal), `6011920a8` (chips). NOTE: legal EN/DE are machine-assisted — flag for professional legal review before relying on them. Panel stays Polish-only by project rule (booking chips not translated).
- **Employee self-service schedule DONE 2026-06-16** (owner chose "Employee edits OWN timetable"): backend (`59a7c9afd`) — `timetables` POST/PATCH/DELETE + exception PATCH/DELETE now allow `Role.Employee`; service `assertCanManage` enforces employee.id === timetable.employeeId (Admin/Receptionist unrestricted); GET `/timetables` scoped to self for employees; **approve leave request stays Admin-only**. Panel (`d02d0e45d`) — topbar user menu shows "Mój grafik" (employees only) → `/schedule` (redirects to `/settings/timetable/employees/<own id>`); the timetable page now allows role employee (RouteGuard `['admin','employee']`, dropped `nav:settings`), clamps the URL to the employee's own id, hides the staff-picker sidenav for them. Admin flow unchanged. **Verify by logging in as an Employee-role account** (e.g. Aleksandra if her account is Employee not Admin) → topbar → Mój grafik → edit hours → save. Role-capability audit recorded: Employee can fully manage appointments (create/reschedule/status/finalize) + customers (CRUD minus delete); cannot touch services catalog/products/stats/communication/settings/employee-params (services-assignment + commission rules + role changes are Admin/Receptionist).
