# 00-STACK-OVERVIEW.md

## Cel
Zbudować **multi-tenant** system panelowy dla salonów (jeden produkt, wiele salonów/tenantów) w stacku:
- **Frontend:** Next.js 14+ (App Router)
- **Backend:** NestJS (TypeScript)
- **DB:** PostgreSQL

## Decyzje architektoniczne (zamknięte)
- **Next.js, nie Nuxt** (ekosystem + wzorce auth + tooling).
- **SSR + SPA hybryda:** Server Components domyślnie, Client Components tylko tam, gdzie interakcja/stan.
- **API:** REST + wersjonowanie (`/api/v1`), DTO + walidacja.
- **ORM:** Prisma (DX, migracje, szybkość).
- **Cache / kolejki:** Redis + BullMQ.
- **Asynchroniczność krytyczna:** outbox + idempotency (SMS/email/PDF), ledger dla magazynu.

## Co usuwamy ("laravelowe" / sesyjne naleciałości)
- Brak **server session** jako fundamentu auth (żadne „destroy session” jako primary).
- Brak logiki zależnej od frameworkowych session middleware.
- Logout = **unieważnienie refresh tokenów + skasowanie cookie**, nie „kasuj sesję”.

## Konwencje repo (monorepo)
Rekomendowane: **pnpm + turborepo**.

```
repo/
  apps/
    web/      # Next.js
    api/      # NestJS
    worker/   # BullMQ worker (osobny proces)
  packages/
    shared/   # DTO types, zod schemas, utils
    ui/       # opcjonalnie: shared UI primitives/tokens
```

## Tech stack — konkret
### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (opcjonalnie, jako akcelerator UI)
- Forms: React Hook Form + Zod
- Data: TanStack Query (dla client interakcji)
- i18n: next-intl (PL default)

### Backend
- NestJS (TypeScript)
- Swagger/OpenAPI generowany z dekoratorów
- ValidationPipe (class-validator / class-transformer)
- Auth: JWT access + refresh cookie (rotacja)
- Redis: cache + queues

### Infra
- Docker Compose (dev)
- Nginx (reverse proxy)
- CI/CD: GitHub Actions
- Observability: Sentry + OpenTelemetry (min. trace-id / request-id)

---

# 01-MULTITENANCY-ROUTING.md

## Multi-tenancy — model
Jeden backend, jedna baza, **wszystkie dane tenantowe zawierają `salon_id`**.

### Strategia tenant w URL (standard)
- **Panel (UX):** `/{salonSlug}/...`
- **API (stabilność):** `/api/v1/salons/{salonId}/...`

To jest standard obowiązkowy. Nie mieszamy z tenantem w headerze jako primary.

### Alternatywa (opcjonalna integracyjnie)
- Header: `X-Salon-Id` dla integracji machine-to-machine.
- Warunek: nadal wymuszamy zgodność z uprawnieniami (TENANT_MISMATCH jako twardy błąd).

## Routing panelu (Next)
Konwencja: **kebab-case** w URL (czytelność). Jeśli stare ścieżki mają `_`, robimy rewrites.

Przykładowe ścieżki:
- `/{salonSlug}` → dashboard
- `/{salonSlug}/calendar`
- `/{salonSlug}/customers`
- `/{salonSlug}/customers/new`
- `/{salonSlug}/customers/{customerId}`
- `/{salonSlug}/products`
- `/{salonSlug}/orders/new`
- `/{salonSlug}/usages/new`
- `/{salonSlug}/deliveries/new`
- `/{salonSlug}/product-orders`
- `/{salonSlug}/statistics/dashboard`
- `/{salonSlug}/communication`
- `/{salonSlug}/services`
- `/{salonSlug}/settings`
- `/{salonSlug}/extension`
- `/{salonSlug}/notification-center/notifications`

### Rewrites (jeśli trzeba kompatybilności)
- `/notification_center/notifications` → `/notification-center/notifications`

## Tenant resolution
### Panel
1. Z URL bierzemy `salonSlug`.
2. Backend mapuje `slug → salonId` (jednoznaczne, z indeksem UNIQUE).
3. Backend weryfikuje, czy user ma membership w salonie.

### API
- Dla endpointów tenantowych **wymagane** jest `{salonId}` w path.

## Tenant guard — twarde wymaganie
W Nest każdy request tenantowy przechodzi przez:
- `TenantResolver` → ustawia `req.tenant = { salonId }`
- `TenantGuard` → sprawdza membership (RBAC + salonId)

Brak salonId lub brak membership = **403 FORBIDDEN / TENANT_MISMATCH**.

---

# 02-AUTH-SECURITY.md

## Auth — rekomendacja produkcyjna
**Access JWT + Refresh token w httpOnly cookie (rotacja).**

### Token policy
- Access token: 10–15 min, trzymany **w pamięci** (frontend) albo wyłącznie po stronie serwera (BFF).
- Refresh token: 14–30 dni, **httpOnly cookie**, rotowany.

### Endpointy
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

### Logout (bez sesji)
- Unieważnij refresh token w DB (lub oznacz jako revoked).
- Skasuj cookie.

## Integracja Next ↔ Nest: 2 warianty
### Wariant A — Direct (CORS + credentials)
- Panel woła `api.*` bezpośrednio.
- Wymaga: `credentials: 'include'`, CORS `credentials=true`, poprawne domeny cookie.

### Wariant B — BFF (zalecane na dłuższą metę)
- Next robi route handlers `/api/*` jako proxy do Nest.
- Cookies zostają w 1 origin, mniej CORS-bólu.
- Bonus: łatwiej ukryć access token (server-only).

## RBAC
- Role na poziomie salonu: `admin`, `employee`, `receptionist` (minimum).
- Autoryzacja: `RolesGuard` + `Permissions` (np. `customers:read`, `appointments:write`).

## Security hardening (must-have)
- Rate limiting na `/auth/login`, `/auth/refresh` (per IP + per user).
- Brute-force lockout (np. 5 prób / 15 min).
- Password hashing: Argon2.
- MFA (opcjonalnie później).
- Audit log (kto/co/kiedy/IP).

## Cookies
- `HttpOnly`, `Secure`, `SameSite=Lax` (subdomeny są „same-site”).
- `Domain=.salon-bw.pl` (jeśli panel i api na subdomenach).
- Rotacja refresh tokenów: każdy refresh wydaje nowy.

---

# 03-API-CONVENTIONS.md

## Versioning
- `/api/v1/...` w path.

## Response envelope (standard)
```json
{
  "data": {},
  "meta": {"requestId": "..."},
  "errors": []
}
```

## Pagination
Query:
- `page=1&perPage=20`

Meta:
```json
"meta": {
  "page": 1,
  "perPage": 20,
  "total": 123,
  "totalPages": 7
}
```

## Sorting
- `sort=createdAt,-name`

## Filtering
- `filter[status]=confirmed`
- `filter[dateFrom]=2026-02-01&filter[dateTo]=2026-02-07`

## Error model
```json
{
  "data": null,
  "meta": {"requestId": "..."},
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid payload",
      "details": {"field": "email"}
    }
  ]
}
```

### Minimalny katalog kodów
- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `TENANT_MISMATCH`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## Idempotency (dla operacji wrażliwych)
- Header: `Idempotency-Key: <uuid>`
- Wymagane dla:
  - wysyłki wiadomości (SMS/email)
  - tworzenia transakcji magazynowych (sale/usage/delivery)
  - generacji PDF (druk)

Serwer:
- tabela `idempotency_keys` (scoped per salon + endpoint)
- identyczny request → identyczna odpowiedź

## OpenAPI/Swagger
- Automatycznie z dekoratorów (DTO + @ApiProperty).
- Endpoint: `/api/docs`.

---

# 04-BACKEND-NESTJS-ARCHITECTURE.md

## Zasady
- Moduły domenowe, zero „god module”.
- DTO + walidacja na wejściu.
- Serwisy bez zależności od HTTP (łatwe testy).

## Minimalny podział modułów
- `AuthModule`
- `TenancyModule` (resolver + guard)
- `UsersModule`, `RolesModule` (RBAC/permissions)
- `CustomersModule`
- `CalendarModule` (appointments + availability + calendar views)
- `ServicesModule`
- `InventoryModule` (products + stock ledger)
- `StatsModule` (dashboards/raporty)
- `MessagingModule` (outbox + delivery status)
- `SettingsModule`
- `FilesModule` (S3/MinIO uploads)

## Cross-cutting
### Global pipes/filters/interceptors
- `ValidationPipe({ whitelist: true, transform: true })`
- `HttpExceptionFilter` (mapuje na standard errors)
- `ResponseEnvelopeInterceptor` (opakowuje `data/meta/errors`)
- `RequestIdInterceptor` (x-request-id)

### Tenancy
- `@Tenant()` decorator → daje `salonId` w handlerach.
- `TenantGuard` jako global guard na tenantowych kontrolerach.

## Project structure (api)
```
apps/api/src/
  main.ts
  app.module.ts
  common/
    interceptors/
    filters/
    guards/
    decorators/
  modules/
    auth/
    tenancy/
    customers/
    calendar/
    services/
    inventory/
    messaging/
    stats/
    settings/
```

## DB access
- PrismaClient w `DatabaseModule`.
- Każde zapytanie tenantowe musi zawierać `salonId` w where.

## Walidacja DTO
- request DTO (Create/Update)
- response DTO (public shape)

---

# 05-DATABASE-POSTGRES-PRISMA.md

## Standard danych
- Każda tabela tenantowa ma `salon_id BIGINT NOT NULL` + FK.
- Indeksy: zawsze composite `(salon_id, <często filtrowane pole>)`.

## Money
- `NUMERIC(12,2)` (nie FLOAT).

## Time
- trzymamy w DB jako `timestamptz`.
- `salons.timezone` default `Europe/Warsaw`.

## Tabele krytyczne (do dopięcia)
### Refresh tokens
- `refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, created_at)`
- scope: per user + per device (opcjonalnie)

### Stock ledger (magazyn)
Nie aktualizujemy „stan = X” jako jedynej prawdy. Prawda to księga.
- `stock_ledger(id, salon_id, product_id, delta_qty, unit, reason, ref_type, ref_id, created_by, created_at)`
- `reason`: `sale|usage|delivery|inventory_adjustment`

Opcjonalnie dla performance:
- `product_stock_balance(product_id, salon_id, qty)` jako cache, aktualizowane transakcyjnie.

### Outbox (wiadomości / integracje)
- `outbox(id, salon_id, aggregate_type, aggregate_id, event_type, payload_json, status, next_attempt_at, attempts, created_at)`

### Idempotency
- `idempotency_keys(id, salon_id, key, endpoint, request_hash, response_json, expires_at, created_at)`

## Indeksy — minimum
- `salons.slug UNIQUE`
- `employees (salon_id, email)`
- `customers (salon_id, name)` + trigram (opcjonalnie)
- `appointments (salon_id, scheduled_at)`
- `stock_ledger (salon_id, product_id, created_at)`
- `outbox (status, next_attempt_at)`

## Multi-tenant safety net (opcjonalnie)
- Postgres **Row Level Security** na tabelach tenantowych.
- Polityka: `salon_id = current_setting('app.salon_id')::bigint`.

---

# 06-ASYNC-CACHE-QUEUES.md

## Cache — zasady
### Frontend (Next)
- Read-heavy: Server Components + `fetch(..., { next: { revalidate: X } })`.
- Mutacje: Client Components + TanStack Query + invalidate.

### Backend (Nest)
- Redis cache dla endpointów:
  - dashboard stats
  - listy (customers, products)
  - calendar views

**Key musi zawierać salonId**:
- `salon:{salonId}:dashboard:{period}`

### Invalidation
- Mutacje appointments → invaliduj dashboard + kalendarz.
- Mutacje inventory → invaliduj produkty + low_stock.

## Kolejki (BullMQ)
- Redis jako broker.
- Worker jako osobny proces (apps/worker).

### Job types
- `send_sms`
- `send_email`
- `generate_pdf_day_schedule`
- `recompute_dashboard_stats`
- `sync_external_booking`

## Outbox pattern (must-have)
W transakcji DB:
1. zapis domenowy (np. utwórz wiadomość / ledger entry)
2. wpis do `outbox`

Worker:
- pobiera outbox `status=pending`
- próbuje dostarczyć (SMS/email)
- oznacza `sent/failed`, ustawia retry backoff

## Idempotency (przykład flow)
- Client wysyła `Idempotency-Key`.
- Serwer hash requestu + zapis odpowiedzi.
- Retry klienta nie generuje dubli.

---

# 07-FRONTEND-NEXTJS-ARCHITECTURE.md

## App Router — struktura
```
apps/web/src/app/
  (auth)/
    login/page.tsx
    forgot-password/page.tsx
  [salonSlug]/
    layout.tsx
    page.tsx                 # dashboard
    calendar/page.tsx
    customers/page.tsx
    customers/new/page.tsx
    customers/[id]/page.tsx
    products/page.tsx
    orders/new/page.tsx
    usages/new/page.tsx
    deliveries/new/page.tsx
    product-orders/page.tsx
    statistics/dashboard/page.tsx
    communication/page.tsx
    services/page.tsx
    settings/page.tsx
    extension/page.tsx
    notification-center/notifications/page.tsx
```

## Bootstrapping w `[salonSlug]/layout.tsx`
- server-side fetch:
  - `GET /auth/me`
  - `GET /salons/resolve?slug=...` (lub `GET /salons/{id}` jeśli znane)
  - `GET /permissions`
- jeśli brak access: redirect do login lub error page.

## Data access
### Read-heavy
- Server Components: proste listy/dashboards.
- Cache: `revalidate` per ekran.

### Interakcje
- Client Components:
  - formularze
  - drag&drop w kalendarzu
  - live updates
- TanStack Query: cache, optimistic updates, invalidation.

## Forms
- React Hook Form + Zod.
- DTO zgodne z backendem (wspólny package `shared`).

## Design system
- Tailwind jako baza.
- Tokeny (kolory/spacing/radius) przeniesione do `tailwind.config`.
- shadcn/ui tylko jako zestaw gotowych prymitywów (bez vendor lock-in).

---

# 08-DEVOPS-OBSERVABILITY.md

## Docker Compose (dev)
- `postgres:15`
- `redis:7`
- `api`
- `web`
- `worker`

## Migracje
- Uruchamiane automatycznie w CI i w deployu (przed startem aplikacji): `prisma migrate deploy`.

## Logging
- `x-request-id` w każdym request/response.
- Strukturalny logger (pino/winston).

## Monitoring
- Sentry (frontend + backend)
- OpenTelemetry (trace między web/api/worker)

## Security headers (web)
- CSP (minimum viable)
- HSTS (prod)
- X-Content-Type-Options

## Backup
- snapshoty bazy (daily) + retention.
- test restore raz na sprint (serio).

