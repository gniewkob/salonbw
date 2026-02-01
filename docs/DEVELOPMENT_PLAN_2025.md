# Development Plan 2025-2026

**Last Updated:** 2025-11-01
**Status:** Active Planning Document
**Owner:** Development Team

This document provides a structured development plan building on [ROADMAP.md](../ROADMAP.md) and [plan.md](../plan.md), incorporating technical improvements identified in the November 2025 repository review.

---

## Executive Summary

The Salon Black & White platform is production-ready with strong foundations. This plan focuses on:
1. **Q4 2025** - Technical excellence (security, performance, type safety, monitoring)
2. **Q1 2026** - Feature completion (POS finalization, reminders, reporting)
3. **Q2 2026** - Growth optimization (analytics, marketing, mobile experience)
4. **Q3 2026** - Scale preparation (multi-location, API v2, architectural improvements)

---

## Q4 2025: Technical Excellence & Hardening

### Phase 1: Security & Type Safety (Weeks 1-3)

#### SEC-1: TypeScript Strictness Improvements
**Priority:** High | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Enable `noImplicitAny: true` in backend `tsconfig.json`
- Remove all explicit `any` types, replace with proper types or `unknown`
- Generate and use OpenAPI types consistently across landing/panel and backend
- Add `strictNullChecks` and `strictFunctionTypes`

**Tasks:**
- [ ] Audit all `any` usages in backend (estimate ~50 occurrences)
- [ ] Update transaction context types (currently using `any`)
- [ ] Enable strict TypeScript flags incrementally per module
- [ ] Add pre-commit hook to prevent new `any` types
- [ ] Document type conventions in `docs/CONTRIBUTING.md`

**Success Metrics:**
- Zero `any` types in new code (enforced by lint)
- 95%+ type coverage (measured by `type-coverage` package)
- All API calls use generated OpenAPI types

**Dependencies:** None

---

#### SEC-2: Content Security Policy Hardening
**Priority:** High | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Remove `'unsafe-inline'` and `'unsafe-eval'` from CSP
- Implement nonce-based script loading for Next.js
- Add strict CSP reporting endpoint
- Document CSP management in security docs

**Tasks:**
- [ ] Implement CSP nonce generation middleware
- [ ] Migrate inline scripts to external files or nonce-based
- [ ] Configure Next.js to use CSP nonces (see Next.js 14 docs)
- [ ] Add `/api/csp-report` endpoint for violations
- [ ] Update [docs/SECURITY_HEADERS.md](SECURITY_HEADERS.md) with CSP policy
- [ ] Test with CSP evaluator tool (csp-evaluator.withgoogle.com)

**Success Metrics:**
- CSP score A+ on securityheaders.com
- Zero CSP violations in production logs (after 1 week)
- All scripts/styles load correctly with strict CSP

**Dependencies:** None

---

#### SEC-3: Dependency Security & Vulnerability Management
**Priority:** Medium | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Add automated dependency vulnerability scanning
- Establish dependency update cadence
- Document security incident response

**Tasks:**
- [ ] Add Dependabot or Snyk to GitHub repo
- [ ] Configure automated PR creation for security patches
- [ ] Add `pnpm audit` to CI pipeline (fail on high/critical)
- [ ] Create dependency update policy in `docs/CONTRIBUTING.md`
- [ ] Add security incident runbook to `docs/AGENT_OPERATIONS.md`
- [ ] Schedule quarterly dependency review (add to calendar)

**Success Metrics:**
- Zero high/critical vulnerabilities in production dependencies
- Security patches applied within 7 days of disclosure
- Automated vulnerability reports weekly

**Dependencies:** None

---

### Phase 2: Performance Optimization (Weeks 4-6)

#### PERF-1: Image Optimization & CDN Strategy
**Priority:** High | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Enable Next.js Image Optimization on production
- Implement responsive image sizing
- Optimize gallery loading performance
- Measure and improve Core Web Vitals

**Tasks:**
- [ ] Audit MyDevil hosting for image optimization support
- [ ] Configure `next/image` with optimal settings for shared hosting
- [ ] Convert all `<img>` tags to `<Image>` components
- [ ] Add responsive `sizes` attribute to gallery images
- [ ] Implement lazy loading with intersection observer fallback
- [ ] Add Lighthouse CI to pull request checks (target scores: 90+)
- [ ] Document image optimization config in `docs/DEPLOYMENT_MYDEVIL.md`

**Success Metrics:**
- Largest Contentful Paint (LCP) < 2.5s on 3G
- Cumulative Layout Shift (CLS) < 0.1
- Image bandwidth reduced by 50%+ (measure with DevTools)
- Lighthouse Performance score 90+ on mobile

**Dependencies:** MyDevil hosting configuration

---

#### PERF-2: Database Query Optimization
**Priority:** Medium | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Identify and optimize slow queries
- Add database connection pooling
- Implement query result caching
- Add database performance monitoring

**Tasks:**
- [ ] Enable PostgreSQL slow query logging (queries > 1s)
- [ ] Add TypeORM query logging in development
- [ ] Audit N+1 query patterns (use `relations` vs separate queries)
- [ ] Configure connection pool settings (min/max/idle timeout)
- [ ] Add Redis for frequently accessed data (services, products)
- [ ] Implement cache invalidation strategy
- [ ] Add database metrics to Prometheus (`connection_pool_size`, `query_duration`)
- [ ] Document caching strategy in `docs/ARCHITECTURE.md`

**Success Metrics:**
- P95 query time < 100ms
- Zero N+1 query patterns in hot paths
- Cache hit rate > 80% for product/service lookups
- Database connection pool efficiency > 90%

**Dependencies:** Redis instance (optional, can use in-memory cache initially)

---

#### PERF-3: Frontend Bundle Optimization
**Priority:** Medium | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Reduce initial JavaScript bundle size
- Implement code splitting for dashboard routes
- Lazy load heavy dependencies (FullCalendar, charts)
- Improve Time to Interactive (TTI)

**Tasks:**
- [x] Analyze bundle with `@next/bundle-analyzer` (2025-11-01)
- [x] Implement dynamic imports for dashboard-only components (client/admin/receptionist/services dashboards switched to dynamic Stats widgets/DataTable/Shortcut cards – 2025-11-09)
- [x] Lazy load FullCalendar (employee, admin scheduler, appointments, receptionist dashboards now use async plugin loading – 2025-11-09)
- [x] Remove unused dependencies (audit with `depcheck`) — axios/mocks/msw dropped 2025-11-03; remaining flags justified
- [x] Add bundle size check to CI (fail if > 300KB First Load JS) — enforced via `scripts/check-bundle-size.mjs` (2025-11-03)
- [x] Split dashboard code by role (DashboardLayout dynamically loads per-role sidebars; role dashboards lazy-load their widgets/forms – 2025-11-09)
- [x] Document bundle optimization in `docs/CONTRIBUTING.md`

**Success Metrics:**
- First Load JS < 250KB (Next build reports ~153 kB shared first-load JS as of 2025-11-09)
- Dashboard route chunks < 100KB each (individual `/dashboard/*` pages now render with ~1–3 kB route code after lazy loading)
- Time to Interactive < 3.5s on 3G (Lighthouse desktop run on `/dashboard` reports TTI ≈ 1.4 s)
- Lighthouse Performance score 95+ on desktop (latest run scored 0.91/1.00 ≈ 91; follow-up tuning needed to clear the final gap)

**Dependencies:** None

**Progress Notes:**
- 2025-11-01 – Employee dashboard chunk reduced from 76 kB/242 kB first-load to 1.1 kB/158 kB by lazy loading FullCalendar + modal components.
- 2025-11-01 – Admin scheduler first-load shrank from 239 kB → 159 kB after async plugin loading and modal code splitting; admin retail route now 157 kB (was 195 kB).
- 2025-11-01 – Shared appointments hub defers FullCalendar + forms, cutting route chunk from 109 kB to ~3 kB with 158 kB first-load.
- 2025-11-01 – Bundle analyzer confirms all calendar-driven dashboards now ship <4 kB route code with ~158 kB first-load JS (down from 195–261 kB).
- 2025-11-03 – CI now fails builds if monitored routes exceed 300 kB gzipped first-load JS (`apps/panel/scripts/check-bundle-size.mjs`, enforced in `ci.yml`).
- 2025-11-03 – `depcheck` (frontend) flagged `autoprefixer`, `axios`, `sharp`, and several dev dependencies; confirmed PostCSS relies on `autoprefixer`/`@tailwindcss/postcss`, kept `sharp` for Next image optimisation, removed unused `axios`/`axios-mock-adapter`/`msw`, and added `@jest/globals` dev dep for explicit import.
- 2025-11-06 – Removed `@radix-ui/react-select` usage across dashboard/public forms; native `<select>` elements now replace Radix widgets, eliminating the 255 kB Floating UI chunk from `_app` and keeping shared JS ~149 kB.
- 2025-11-09 – Client/admin/receptionist/services dashboards now lazy-load Stats widgets, tables, shortcut cards, and modals; receptionist calendar defers plugin loading, keeping each dashboard chunk under 4 kB while the shared first-load bundle remains ~150 kB.

---

### Phase 3: Monitoring & Observability (Weeks 7-8)

#### OBS-1: Centralized Logging & Alerting
**Priority:** High | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Aggregate logs from all applications
- Implement log-based alerting
- Create operational dashboards
- Document on-call procedures

**Tasks:**
- [x] Evaluate logging solutions (Grafana Loki vs. ELK vs. Datadog vs. Sentry) — Loki + Promtail chosen (2025-11-09) for cost efficiency and native Prometheus/Grafana integration.
- [x] Configure Pino to ship logs to centralized service (Loki transport enabled via `LOKI_URL`/`LOKI_BASIC_AUTH` – 2025-11-09)
- [x] Add structured logging to frontend (client errors flow through `/logs/client` with token auth – 2025-11-09)
- [x] Create log-based alerts (error rate, 5xx responses, auth failures) — thresholds documented in `docs/AGENT_OPERATIONS.md`
- [x] Build operational dashboard (request rate, latency, errors) — Grafana dashboard+queries recorded in runbook
- [x] Document log queries and alert thresholds in `docs/AGENT_OPERATIONS.md`
- [x] Create on-call runbook with common incident patterns (Observability section expanded – 2025-11-09)

**Success Metrics:**
- All logs searchable within 1 minute of generation
- Critical alerts delivered via email/SMS within 2 minutes
- Mean Time to Detection (MTTD) < 5 minutes
- 100% of production errors captured and queryable

**Dependencies:** Logging service subscription (budget: ~$50-100/month)

---

#### OBS-2: Application Performance Monitoring (APM)
**Priority:** Medium | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Add distributed tracing for requests
- Monitor database query performance
- Track user-facing performance metrics
- Create performance regression alerts

**Tasks:**
- [x] Integrate APM tool (Sentry Performance adopted for backend + frontend – 2025-11-15)
- [x] Add trace context to all API requests (Sentry scope tags carry `request_id` – 2025-11-15)
- [x] Instrument slow transaction detection (> 1s) — `APM_SLOW_REQUEST_MS` triggers `slow_http_request` issues in Sentry.
- [x] Add Real User Monitoring (RUM) to frontend via `@sentry/nextjs` BrowserTracing + Replay toggles.
- [x] Create performance dashboards (P50/P95/P99 latencies tracked inside Sentry Performance views, linked from runbook).
- [x] Set up performance regression alerts (Sentry alerts for API P95>500 ms / Frontend INP>400 ms – 2025-11-15).
- [x] Document APM queries in `docs/AGENT_OPERATIONS.md` (section 5.5).

**Success Metrics:**
- 100% of API requests traced end-to-end
- Performance regressions detected before user reports
- P95 API response time < 500ms
- Frontend performance tracked per page/route

**Dependencies:** APM service subscription (budget: ~$50-100/month)

---

#### OBS-3: Uptime Monitoring & Health Checks
**Priority:** High | **Effort:** 3 days | **Owner:** TBD

**Objectives:**
- Monitor production uptime from external locations
- Implement comprehensive health checks
- Create incident response procedures
- Track SLA/uptime metrics

**Tasks:**
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, or similar)
- [ ] Monitor key endpoints: `/healthz`, `/api/appointments`, public pages
- [ ] Add detailed health checks (DB connection, SMTP, Instagram API)
- [ ] Configure multi-region checks (US, EU)
- [ ] Set up SMS/email alerts for downtime (< 1 minute alert time)
- [ ] Create incident response template in `docs/AGENT_OPERATIONS.md`
- [ ] Track monthly uptime in `docs/AGENT_STATUS.md`

**Success Metrics:**
- 99.9% uptime SLA (< 43 minutes downtime/month)
- Downtime alerts delivered within 1 minute
- Health check failures auto-restart applications (via monitoring)
- Zero undetected outages

**Dependencies:** Uptime monitoring service (budget: ~$10-20/month)

---

### Phase 4: Testing & Quality (Weeks 9-10)

#### TEST-1: Expand E2E Test Coverage
**Priority:** Medium | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Cover critical user journeys with E2E tests
- Add visual regression testing
- Implement E2E test CI performance optimization
- Increase confidence in deployments

**Tasks:**
- [ ] Map critical user flows (booking appointment, POS transaction, login)
- [ ] Write Cypress tests for 10+ critical paths
- [ ] Add visual regression tests with Percy or Chromatic
- [ ] Implement test data seeding for consistent E2E runs
- [ ] Optimize Cypress CI runtime (parallel execution, smart test selection)
- [ ] Add E2E smoke tests to deployment workflow
- [ ] Document E2E test patterns in `docs/CONTRIBUTING.md`

**Success Metrics:**
- 15+ critical user flows covered by E2E tests
- E2E test suite runs in < 10 minutes on CI
- Zero false positives/flaky tests
- Visual regressions caught before production

**Dependencies:** Visual regression service (optional, budget: ~$30/month)

---

#### TEST-2: Backend Integration Test Suite
**Priority:** Medium | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Add comprehensive integration tests for API endpoints
- Test database transaction edge cases
- Validate authentication/authorization flows
- Improve backend test coverage

**Tasks:**
- [ ] Set up test database fixtures with realistic data
- [ ] Write integration tests for all REST endpoints
- [ ] Test multi-step workflows (appointment creation → commission calculation)
- [ ] Add tests for error scenarios (validation, auth failures, race conditions)
- [ ] Test WebSocket gateway integration
- [ ] Achieve 80%+ backend line coverage
- [ ] Document integration test patterns in `docs/CONTRIBUTING.md`

**Success Metrics:**
- 80%+ backend test coverage (currently ~70%)
- 100% of API endpoints have integration tests
- Zero untested error paths in critical flows
- Integration tests run in < 2 minutes

**Dependencies:** None

---

## Q1 2026: Feature Completion & Business Value

### Phase 5: Retail POS Finalization (Weeks 11-14)

#### POS-1: Complete Retail Module Implementation
**Priority:** High | **Effort:** 3 weeks | **Owner:** TBD

**Objectives:**
- Complete retail POS UI and workflows
- Implement inventory management
- Add sales reporting
- Launch to staff users

**Tasks:**
- [ ] Finalize `product_sales` and `inventory_movements` tables (already in progress)
- [ ] Complete [apps/panel/src/components/SaleForm.tsx](../apps/panel/src/components/SaleForm.tsx)
- [ ] Complete [apps/panel/src/components/InventoryAdjustmentForm.tsx](../apps/panel/src/components/InventoryAdjustmentForm.tsx)
- [ ] Add barcode scanning support (optional, camera or USB scanner)
- [ ] Implement receipt generation (PDF via PDFKit or thermal printer)
- [ ] Add daily sales summary dashboard widget
- [ ] Create sales history and audit trail views
- [ ] Add inventory low-stock alerts
- [ ] Write comprehensive E2E tests for POS workflow
- [ ] Document POS procedures in staff training guide

**Success Metrics:**
- 100% of product sales recorded in system (vs manual tracking)
- Zero sales data entry errors (validated with manual audit)
- Staff training completed with <30 minutes per user
- Inventory accuracy > 95% (spot checks vs physical count)

**Dependencies:**
- Receipt printer (optional, budget: ~$200)
- Barcode scanner (optional, budget: ~$100)

---

#### POS-2: Commission Reconciliation
**Priority:** High | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Automate commission payouts for product sales
- Create commission reports for employees
- Validate commission calculations (cents-based)
- Implement commission dispute resolution

**Tasks:**
- [ ] Link `product_sales` to `commissions` table (already designed)
- [ ] Add commission preview before completing sale
- [ ] Create employee commission dashboard (daily/weekly/monthly)
- [ ] Add admin commission approval workflow
- [ ] Generate commission payout reports (CSV/PDF)
- [ ] Add commission dispute logging and resolution
- [ ] Write unit tests for all commission edge cases
- [ ] Document commission rules in staff handbook

**Success Metrics:**
- 100% of commissions calculated automatically
- Zero commission calculation disputes (validated math)
- Commission reports generated in < 5 seconds
- Employee commission transparency (self-service dashboard)

**Dependencies:** POS-1 completion

---

### Phase 6: Automated Reminders (Weeks 15-17)

#### REM-1: Appointment Reminder System
**Priority:** High | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Restore WhatsApp/SMS appointment reminders
- Implement configurable reminder schedules
- Add customer opt-in/opt-out management
- Track delivery metrics

**Tasks:**
- [ ] Evaluate reminder services (Twilio, WhatsApp Business API, or similar)
- [ ] Implement reminder scheduling (24h, 1h before appointment)
- [ ] Add customer communication preferences to user profile
- [ ] Create reminder template system (editable by admin)
- [ ] Implement retry logic for failed deliveries
- [ ] Add opt-out link in reminder messages
- [ ] Track reminder metrics (sent, delivered, failed, opt-outs)
- [ ] Add admin dashboard for reminder analytics
- [ ] Document reminder configuration in `docs/AGENT_OPERATIONS.md`

**Success Metrics:**
- 90%+ appointment reminder delivery rate
- No-show rate reduced by 30%+ (baseline vs 3 months after)
- < 5% opt-out rate
- Reminder delivery latency < 5 minutes from scheduled time

**Dependencies:**
- Messaging service subscription (budget: ~$50-100/month)
- WhatsApp Business API approval (if using WhatsApp)

---

#### REM-2: Marketing & Follow-Up Campaigns
**Priority:** Medium | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Send post-appointment follow-ups
- Implement birthday/anniversary messages
- Create re-engagement campaigns
- Track campaign effectiveness

**Tasks:**
- [ ] Design email templates (thank you, birthday, win-back)
- [ ] Implement email campaign scheduling (NestJS cron)
- [ ] Add campaign tracking (opens, clicks, conversions)
- [ ] Create admin UI for campaign management
- [ ] Implement customer segmentation (by visit frequency, spend)
- [ ] Add A/B testing for email subject lines
- [ ] Document campaign best practices in marketing playbook

**Success Metrics:**
- 30%+ email open rate
- 5%+ click-through rate
- 10% increase in repeat bookings (6-month measurement)
- Campaign ROI > 3x (revenue per campaign vs. cost)

**Dependencies:** REM-1 completion

---

### Phase 7: Advanced Reporting (Weeks 18-20)

#### REP-1: Business Intelligence Dashboard
**Priority:** High | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Create comprehensive admin analytics dashboard
- Visualize key business metrics
- Enable self-service reporting
- Support data-driven decisions

**Tasks:**
- [ ] Design dashboard layout (revenue, bookings, products, staff)
- [ ] Implement data aggregation queries (daily/weekly/monthly)
- [ ] Add interactive charts (Recharts or Chart.js)
- [ ] Create date range selectors and filters
- [ ] Add drill-down capabilities (click chart to see details)
- [ ] Implement real-time metrics (today's revenue, active bookings)
- [ ] Add dashboard export (PDF snapshot)
- [ ] Optimize query performance (add materialized views if needed)
- [ ] Document dashboard metrics in admin guide

**Dashboard Metrics:**
- **Revenue:** Daily/weekly/monthly, by service/product, trends
- **Bookings:** Appointment count, cancellation rate, utilization %
- **Products:** Sales volume, inventory turnover, low-stock alerts
- **Staff:** Performance by employee, commission summary, hours worked
- **Customers:** New vs. returning, retention rate, LTV

**Success Metrics:**
- Dashboard loads in < 2 seconds
- Admin uses dashboard 3+ times per week
- Data-driven decision examples documented
- 100% accuracy vs. manual calculations

**Dependencies:** None

---

#### REP-2: Report Generation & Exports
**Priority:** Medium | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Generate downloadable reports (CSV, PDF)
- Implement scheduled report delivery
- Create report templates
- Archive historical reports

**Tasks:**
- [ ] Implement CSV export for all dashboard views
- [ ] Create PDF report templates (revenue summary, staff performance)
- [ ] Add scheduled report generation (weekly/monthly via cron)
- [ ] Email reports to stakeholders automatically
- [ ] Add report archive with search/filter
- [ ] Create custom report builder (select metrics, date range, format)
- [ ] Document report definitions in admin guide

**Success Metrics:**
- Reports generated in < 10 seconds
- 100% of required reports available on-demand
- Weekly automated reports delivered on schedule
- Zero manual report generation (fully automated)

**Dependencies:** REP-1 completion

---

## Q2 2026: Growth Optimization

### Phase 8: Analytics & Conversion Optimization (Weeks 21-24)

#### CONV-1: Booking Funnel Optimization
**Priority:** High | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Improve booking conversion rate
- Simplify booking flow
- Add persistent CTAs
- A/B test booking forms

**Tasks:**
- [ ] Audit current booking flow (identify drop-off points)
- [ ] Implement GA4 funnel analysis (view_item → begin_checkout → purchase)
- [ ] Add floating/sticky "Book Now" CTA on all pages
- [ ] Simplify contact form (reduce fields, progressive disclosure)
- [ ] Add social proof on booking page (recent bookings, testimonials)
- [ ] Implement A/B testing framework (Next.js middleware)
- [ ] Test variations: form length, CTA copy, colors
- [ ] Add booking abandonment recovery (email follow-up)
- [ ] Document conversion optimization wins in marketing playbook

**Success Metrics:**
- 20%+ increase in booking conversion rate
- 30%+ reduction in form abandonment
- Booking intent to completion < 3 minutes
- A/B test statistical significance within 2 weeks

**Dependencies:** None

---

#### CONV-2: SEO & Local Search Optimization
**Priority:** High | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Improve search engine rankings
- Optimize for local searches
- Create location/service landing pages
- Implement structured data

**Tasks:**
- [ ] Conduct keyword research (Google Keyword Planner, Ahrefs)
- [ ] Create location landing pages (e.g., "/services/haircut-boston")
- [ ] Add schema.org structured data (`LocalBusiness`, `Service`, `Review`)
- [ ] Implement FAQ schema on key pages
- [ ] Optimize meta titles/descriptions for target keywords
- [ ] Add alt text to all images (gallery, services)
- [ ] Create XML sitemap with priority/changefreq
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor rankings weekly (SEMrush or similar)
- [ ] Build backlinks (local directories, partnerships)
- [ ] Document SEO strategy in marketing playbook

**Success Metrics:**
- Top 3 ranking for primary keywords (3 months)
- 50%+ increase in organic traffic (6 months)
- Google My Business listing optimized (photos, hours, reviews)
- Local pack appearance for "salon near me" searches

**Dependencies:** None

---

#### CONV-3: Social Proof & Trust Signals
**Priority:** Medium | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Display customer testimonials
- Showcase stylist expertise
- Highlight before/after transformations
- Integrate review platforms

**Tasks:**
- [ ] Create testimonial collection system (post-appointment email)
- [ ] Design testimonial carousel for homepage
- [ ] Add stylist bio pages with photos and specialties
- [ ] Create before/after gallery (with customer consent)
- [ ] Integrate Google Reviews API (display rating/reviews)
- [ ] Add trust badges (certifications, awards, years in business)
- [ ] Implement review request automation (7 days post-appointment)
- [ ] Document review management in staff handbook

**Success Metrics:**
- 50+ customer testimonials collected (6 months)
- 4.5+ star average on Google Reviews
- 20%+ increase in booking after viewing testimonials
- Review volume increase 3x (baseline vs. 6 months)

**Dependencies:** Review platform integration (Google, Yelp, Facebook)

---

### Phase 9: Mobile Experience (Weeks 25-27)

#### MOB-1: Progressive Web App (PWA)
**Priority:** Medium | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Enable offline functionality
- Add "Add to Home Screen" capability
- Improve mobile performance
- Support push notifications

**Tasks:**
- [ ] Configure Next.js PWA plugin (next-pwa)
- [ ] Create service worker for offline caching
- [ ] Add web app manifest (icons, theme colors)
- [ ] Implement offline fallback pages
- [ ] Test offline functionality (airplane mode)
- [ ] Add push notification support (appointment confirmations)
- [ ] Optimize mobile touch targets (min 44x44px)
- [ ] Test on iOS and Android devices
- [ ] Document PWA installation in user guide

**Success Metrics:**
- Lighthouse PWA score 100/100
- < 3 second load time on 3G
- 10%+ users install PWA (vs. mobile web)
- Push notification opt-in rate > 40%

**Dependencies:** None

---

#### MOB-2: Mobile-Optimized Staff View
**Priority:** Low | **Effort:** 1 week | **Owner:** TBD

**Objectives:**
- Create mobile dashboard for employees
- Enable quick actions on mobile
- Support offline check-in/notes
- Improve field productivity

**Tasks:**
- [ ] Design mobile-first dashboard layout
- [ ] Add quick action buttons (check-in, add note, view schedule)
- [ ] Implement swipe gestures for common actions
- [ ] Add offline mode for check-ins (sync when online)
- [ ] Create simplified appointment list for mobile
- [ ] Add biometric authentication (Face ID, fingerprint)
- [ ] Test usability with staff on actual devices
- [ ] Document mobile workflows in staff handbook

**Success Metrics:**
- Staff mobile usage > 50% of dashboard access
- Check-in time < 10 seconds on mobile
- 90%+ staff satisfaction with mobile experience
- Zero lost data from offline mode

**Dependencies:** MOB-1 completion

---

## Q3 2026: Scale Preparation

### Phase 10: Multi-Location Support (Weeks 28-32)

#### SCALE-1: Multi-Location Data Model
**Priority:** Medium | **Effort:** 3 weeks | **Owner:** TBD

**Objectives:**
- Support multiple salon locations
- Enable location-aware scheduling
- Separate inventory per location
- Implement cross-location reporting

**Tasks:**
- [ ] Add `locations` table (id, name, address, phone, timezone, settings)
- [ ] Add `locationId` foreign key to relevant tables (appointments, users, products, inventory)
- [ ] Create location switching UI in dashboard
- [ ] Implement location-scoped queries (add location filter to all queries)
- [ ] Add location-based permissions (staff can only see their location)
- [ ] Support cross-location transfers (inventory, staff assignments)
- [ ] Create consolidated reporting across all locations
- [ ] Migrate existing data to default location
- [ ] Write migration plan and rollback procedures
- [ ] Document multi-location architecture in `docs/ARCHITECTURE.md`

**Success Metrics:**
- Support 1-10 locations without performance degradation
- Location data isolated (no cross-contamination)
- Staff can only access authorized locations
- Cross-location reporting accurate to the cent

**Dependencies:** Database migration testing on staging environment

---

#### SCALE-2: API Versioning & Stability
**Priority:** Medium | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Implement API versioning strategy
- Support multiple API versions simultaneously
- Create API deprecation policy
- Improve API documentation

**Tasks:**
- [ ] Design API versioning strategy (URL path: `/api/v2/...`)
- [ ] Implement version routing in NestJS
- [ ] Create v2 API with breaking changes (improved naming, structure)
- [ ] Maintain v1 compatibility during transition
- [ ] Add API version to OpenAPI spec
- [ ] Create API changelog (semver + breaking changes)
- [ ] Implement deprecation warnings in v1 responses
- [ ] Document API versioning in `docs/API_CLIENT.md`
- [ ] Update frontend to use v2 API

**Success Metrics:**
- Zero breaking changes without version bump
- v1 API maintained for 6+ months after v2 launch
- API documentation always current
- Client migration to v2 within 3 months

**Dependencies:** None

---

### Phase 11: Architecture Improvements (Weeks 33-36)

#### ARCH-1: Microservices Preparation
**Priority:** Low | **Effort:** 3 weeks | **Owner:** TBD

**Objectives:**
- Identify service boundaries
- Extract independent services
- Implement message queue
- Improve system resilience

**Tasks:**
- [ ] Conduct domain-driven design workshop (identify bounded contexts)
- [ ] Document service boundaries (appointments, retail, notifications, reporting)
- [ ] Extract notifications service (email, SMS, push)
- [ ] Extract reporting service (analytics, exports)
- [ ] Implement message queue (RabbitMQ or AWS SQS)
- [ ] Add event-driven communication between services
- [ ] Implement saga pattern for distributed transactions
- [ ] Add service-to-service authentication (JWT or mTLS)
- [ ] Monitor inter-service latency
- [ ] Document microservices architecture in `docs/ARCHITECTURE.md`

**Success Metrics:**
- Services can be deployed independently
- Inter-service communication < 50ms P95
- System remains available if one service fails
- Easier to scale individual services

**Dependencies:** Message queue infrastructure (budget: ~$50-100/month)

---

#### ARCH-2: Caching Strategy
**Priority:** Medium | **Effort:** 2 weeks | **Owner:** TBD

**Objectives:**
- Implement multi-layer caching
- Reduce database load
- Improve response times
- Add cache observability

**Tasks:**
- [ ] Implement Redis caching layer
- [ ] Add HTTP caching headers (Cache-Control, ETag)
- [ ] Implement API response caching (GET endpoints)
- [ ] Add browser caching for static assets
- [ ] Implement cache warming for frequently accessed data
- [ ] Create cache invalidation strategy (event-driven)
- [ ] Add cache metrics (hit rate, eviction rate)
- [ ] Monitor cache memory usage
- [ ] Document caching patterns in `docs/ARCHITECTURE.md`

**Cache Layers:**
1. **Browser cache** - Static assets (images, CSS, JS)
2. **CDN cache** - Public pages, images
3. **Redis cache** - API responses, session data
4. **Application cache** - In-memory for frequently accessed data
5. **Database query cache** - PostgreSQL query results

**Success Metrics:**
- 80%+ cache hit rate for hot data
- API response time reduced 50%+ for cached endpoints
- Database query load reduced 60%+
- Cache invalidation < 1 second from data change

**Dependencies:** Redis instance (budget: ~$20-50/month)

---

## Ongoing: Maintenance & Operations

### Operational Excellence

#### OPS-1: Weekly Maintenance Tasks
**Owner:** On-call engineer

- [ ] Review error logs and alerts
- [ ] Check system health metrics
- [ ] Review and merge dependabot PRs
- [ ] Monitor disk space and database size
- [ ] Review slow query logs
- [ ] Check backup integrity
- [ ] Update `docs/AGENT_STATUS.md` if issues found

---

#### OPS-2: Monthly Reviews
**Owner:** Team lead

- [ ] Review uptime and SLA compliance
- [ ] Analyze incident reports and action items
- [ ] Review test coverage metrics
- [ ] Update roadmap based on customer feedback
- [ ] Conduct security review (audit logs, access)
- [ ] Review and update documentation
- [ ] Performance baseline comparison (month over month)

---

#### OPS-3: Quarterly Planning
**Owner:** Product team

- [ ] Review OKRs and success metrics
- [ ] Prioritize feature backlog
- [ ] Conduct technical debt assessment
- [ ] Plan infrastructure upgrades
- [ ] Review team capacity and hiring needs
- [ ] Update ROADMAP.md with next quarter initiatives
- [ ] Stakeholder review and approval

---

## Success Metrics & KPIs

### Technical Health
- **Uptime:** 99.9%+ (< 43 min downtime/month)
- **Performance:** P95 API response < 500ms, LCP < 2.5s
- **Test Coverage:** 80%+ backend, 70%+ frontend
- **Type Safety:** 95%+ type coverage, zero `any` in new code
- **Security:** Zero high/critical vulnerabilities, A+ security headers
- **Code Quality:** Zero lint errors, all PRs reviewed

### Business Metrics
- **Booking Conversion:** 20%+ increase (Q2 2026)
- **No-Show Rate:** 30%+ decrease (Q1 2026)
- **Staff Efficiency:** 50%+ reduction in manual tasks
- **Customer Satisfaction:** 4.5+ star rating, NPS > 50
- **Revenue Growth:** 15%+ increase (year over year)
- **Repeat Booking Rate:** 60%+ of customers

### Operational Metrics
- **Deployment Frequency:** 2-3x per week
- **Lead Time:** < 2 days (feature request to production)
- **MTTR:** < 1 hour (mean time to recovery)
- **Change Failure Rate:** < 5% (deployments requiring hotfix)

---

## Risk Management

### High-Risk Items

1. **Database Migration (SCALE-1)**
   - **Risk:** Data loss or corruption during multi-location migration
   - **Mitigation:** Full backup, test on staging, phased rollout, rollback plan
   - **Owner:** TBD

2. **CSP Hardening (SEC-2)**
   - **Risk:** Breaking existing functionality when removing unsafe-inline
   - **Mitigation:** Test thoroughly on staging, gradual rollout, monitoring
   - **Owner:** TBD

3. **Third-Party Service Dependencies (REM-1, OBS-1)**
   - **Risk:** Vendor outages or API changes
   - **Mitigation:** Multi-vendor strategy, graceful degradation, monitoring
   - **Owner:** TBD

---

## Budget Planning

### Estimated Monthly Recurring Costs

| Service | Provider | Monthly Cost | Start Date |
|---------|----------|--------------|------------|
| APM/Monitoring | Datadog/Sentry | $100-150 | Q4 2025 |
| Log Aggregation | Grafana Cloud | $50-100 | Q4 2025 |
| Uptime Monitoring | UptimeRobot | $10-20 | Q4 2025 |
| SMS/WhatsApp | Twilio | $50-100 | Q1 2026 |
| CDN/Cache | Cloudflare Pro | $20 | Q2 2026 |
| Redis Cache | AWS ElastiCache | $30-50 | Q3 2026 |
| **Total Estimated** | | **$260-440** | Fully ramped |

### One-Time Costs

| Item | Cost | Quarter |
|------|------|---------|
| Receipt Printer | $200 | Q1 2026 |
| Barcode Scanner | $100 | Q1 2026 |
| Performance Testing Tools | $200 | Q4 2025 |
| **Total** | **$500** | |

---

## Communication Plan

### Weekly Standups
- Review in-progress tasks
- Identify blockers
- Update TODO list

### Bi-Weekly Sprint Reviews
- Demo completed features
- Review metrics and KPIs
- Adjust priorities as needed

### Monthly Engineering Updates
- Send progress report to stakeholders
- Review success metrics
- Identify wins and challenges

### Quarterly Planning Sessions
- Review OKRs and roadmap
- Plan next quarter initiatives
- Update documentation

---

## References

- [ROADMAP.md](../ROADMAP.md) - Product roadmap themes
- [plan.md](../plan.md) - Implementation plan and working agreements
- [docs/AGENT_STATUS.md](AGENT_STATUS.md) - Current deployment status
- [docs/AGENT_OPERATIONS.md](AGENT_OPERATIONS.md) - Operations runbook
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [docs/RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) - Pre-deployment checklist

---

## Appendix: Task Tracking

All tasks in this plan should be tracked as GitHub issues with appropriate labels:

- **Labels:** `security`, `performance`, `monitoring`, `feature`, `technical-debt`, `documentation`
- **Milestones:** Q4-2025, Q1-2026, Q2-2026, Q3-2026
- **Projects:** Use GitHub Projects board with columns: Backlog, Planned, In Progress, Review, Done

**Issue Template:**
```markdown
## Description
[What needs to be done]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies
- Issue #XXX
- Service XYZ

## Estimated Effort
X days/weeks

## References
- Link to plan section
- Link to relevant docs
```

---

**Document Status:** Living document - update as priorities change or new information becomes available.
