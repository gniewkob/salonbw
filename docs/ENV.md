# Environment Reference

Use this guide to configure local, staging, and production environments for Salon Black & White. All secrets must be kept out of version control—copy the relevant `.env.example` files and provide real values locally or in your secret manager.

## Backend (`backend/salonbw-backend`)

| Variable | Required | Default / Example | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | `postgres://user:password@localhost:5432/database` | PostgreSQL connection string. In development, point to the SSH tunnel (`localhost:8543`). |
| `FRONTEND_URL` | ✅ (prod) | `https://salon-bw.pl,https://panel.salon-bw.pl,https://admin.salon-bw.pl` | Comma-separated list of allowed origins for CORS and WebSockets. Origins are normalised on startup; invalid URLs fail fast. Leave unset only in local dev. |
| `COOKIE_DOMAIN` | ✅ (prod) | `.salon-bw.pl` | Domain applied to auth/CSRF cookies. Must include leading dot for cross-subdomain flows. Optional in local dev (`localhost`). |
| `JWT_SECRET` | ✅ | `example_jwt_secret` | Secret for signing access tokens. Use a long random string in non-prod environments. |
| `JWT_REFRESH_SECRET` | ✅ | `example_refresh_secret` | Secret for signing refresh tokens. Must differ from `JWT_SECRET`. |
| `ENABLE_SWAGGER` | ➖ | `false` | Set to `true` to expose Swagger at `/api/docs`. Defaults to disabled; enabling in production logs a warning. |
| `THROTTLE_TTL` | ➖ | `60000` | Global rate-limit window in milliseconds. Used by the `ThrottlerModule`. |
| `THROTTLE_LIMIT` | ➖ | `10` | Requests allowed per `THROTTLE_TTL` window. Global default; per-route overrides still apply. |
| `LOKI_URL` | ➖ | `https://loki.example.com/api/prom/push` | When set, production logs are streamed to Grafana Loki via `pino` transport. |
| `LOKI_BASIC_AUTH` | ➖ | `username:password` | Optional basic-auth credentials for Loki ingestion. |
| `CLIENT_LOG_TOKEN` | ➖ | *(unset)* | Shared secret that browser clients must send via `x-log-token` when POSTing to `/logs/client`. Prevents log spam. |
| `SENTRY_DSN` | ➖ | *(unset)* | Enables backend Sentry instrumentation when present. Configure per environment. |
| `SENTRY_TRACES_SAMPLE_RATE` | ➖ | `0.2` | Fraction (0-1) of HTTP/API requests to sample for traces. Set higher for staging. |
| `SENTRY_PROFILES_SAMPLE_RATE` | ➖ | `0` | Fraction of traces to collect CPU profiles for. Keep ≤0.1 to manage volume. |
| `SENTRY_RELEASE` | ➖ | `frontend@1.0.0` | Optional release identifier forwarded to Sentry for trace grouping. |
| `APM_SLOW_REQUEST_MS` | ➖ | `1000` | Requests above this duration trigger a `slow_http_request` capture in Sentry. |
| `POS_ENABLED` | ➖ | `false` | Enable POS endpoints (`/sales`, `/inventory/adjust`) for Employee/Admin roles. Production is `true` since 2025-11-01 18:32 UTC after applying migrations `1710006000000`, `1710007000000`, `1710008000000`; when disabled, both endpoints return 501. |
| `POS_REQUIRE_COMMISSION` | ➖ | `false` | When `true`, POS sales fail if commissions cannot be recorded (useful when product commissions are mandatory). |
| `PRODUCT_COMMISSION_PERCENT` | ➖ | `0` | Default commission percent used for product sales when no employee rule/base is present. |
| `SMTP_HOST` | ➖ | `mail0.mydevil.net` | SMTP server used for transactional email (contact form, notifications). |
| `SMTP_PORT` | ➖ | `465` | SMTP server port. Use `465` for SSL or `587` for STARTTLS. |
| `SMTP_USER` | ➖ | `kontakt@salon-bw.pl` | SMTP username for authentication. |
| `SMTP_PASSWORD` | ➖ | `********` | SMTP password for the account above. |
| `SMTP_SECURE` | ➖ | `true` | Set to `true` when using SSL (port 465); otherwise `false`. |
| `SMTP_FROM` | ➖ | `kontakt@salon-bw.pl` | Sender address that appears in outgoing messages. Defaults to `SMTP_USER` when omitted. |
| `INSTAGRAM_ACCESS_TOKEN` | ➖ | *(unset)* | Optional: used by the backend health check to confirm the public gallery token is still valid. |
| `INSTAGRAM_HEALTH_USER_ID` | ➖ | `me` | Overrides the Instagram Graph user ID to probe during health checks. Defaults to `me`. |
| `INSTAGRAM_HEALTH_TIMEOUT_MS` | ➖ | `5000` | Timeout for the Instagram health probe in milliseconds. |
| `PORT` | ➖ | `3001` | HTTP port for the NestJS server. |
| `WHATSAPP_TOKEN` | ➖ | `your_whatsapp_api_token` | Token for WhatsApp Cloud API integration. Required only if reminders are enabled. |
| `WHATSAPP_PHONE_ID` | ➖ | `1234567890` | WhatsApp Business phone ID. |
| `REMINDER_HOURS_BEFORE` | ➖ | `24` | Hours before an appointment to send reminder messages. |
| `NODE_ENV` | ➖ | `development` | Set to `production` when deploying to disable TypeORM sync. |

#### POS Configuration Flags

- `POS_ENABLED` turns on the POS surface for Employee/Admin roles once migrations `1710006000000`, `1710007000000`, `1710008000000` exist; leaving it `false` keeps POST `/sales` and POST `/inventory/adjust` returning 501.
- `POS_REQUIRE_COMMISSION=true` forces a sale rollback if commission creation fails, preventing partial writes.
- `PRODUCT_COMMISSION_PERCENT` serves as the fallback commission rate when no employee-specific rule is configured.

### Tunnel-Specific Variables

Defined in `.env.development.local` / `.env.test.local` when using the SSH tunnel:

| Variable | Default | Description |
| --- | --- | --- |
| `DB_LOCAL_PORT` | `8543` | Local port forwarded to PostgreSQL through the tunnel. |
| `MYDEVIL_SSH_HOST` | `s0.mydevil.net` | SSH endpoint for mydevil hosting. |
| `MYDEVIL_SSH_USER` | `<login>` | SSH username with database access. |
| `MYDEVIL_PG_HOST` | `pgsql0.mydevil.net` | PostgreSQL host inside mydevil. |
| `MYDEVIL_PG_PORT` | `5432` | PostgreSQL port on mydevil. |

## Frontend (`frontend`)

| Variable | Required | Default / Example | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:3001` | Base URL for the backend API. Prefix with `https://` in production. |
| `NEXT_PUBLIC_SITE_URL` | ➖ | `https://example.com` | Public site URL used for metadata, share links, etc. |
| `NEXT_PUBLIC_BUSINESS_NAME` | ➖ | `Salon Black & White` | Business display name used in JSON-LD |
| `NEXT_PUBLIC_BUSINESS_PHONE` | ➖ | `+48 000 000 000` | Business phone number |
| `NEXT_PUBLIC_BUSINESS_STREET` | ➖ | `123 Salon Street` | Street address |
| `NEXT_PUBLIC_BUSINESS_CITY` | ➖ | `Beauty City` | City |
| `NEXT_PUBLIC_BUSINESS_POSTAL` | ➖ | `00-000` | Postal code |
| `NEXT_PUBLIC_BUSINESS_COUNTRY` | ➖ | `PL` | ISO country code |
| `NEXT_PUBLIC_GA_ID` | ➖ | *(unset)* | Google Analytics ID. |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | ➖ | `false` | Opt-in flag for analytics integrations. |
| `NEXT_PUBLIC_ENABLE_DEBUG` | ➖ | `false` | When `true`, enables developer helpers and adds an `X-Request-Id` header to each API call for log correlation. |
| `NEXT_PUBLIC_CONTACT_RECIPIENT` | ➖ | `kontakt@salon-bw.pl` | Default recipient for the public contact form submissions. |
| `NEXT_PUBLIC_SENTRY_DSN` | ➖ | *(unset)* | Sentry DSN if error tracking is enabled. |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | ➖ | `0.1` | Sampling rate for Sentry tracing. |
| `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | ➖ | `0` | Fraction of sessions recorded with Sentry Replay for passive RUM. |
| `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | ➖ | `1` | Fraction of sessions recorded when an error occurs. Keep ≤1. |
| `NEXT_PUBLIC_ENABLE_CLIENT_LOGS` | ➖ | `true` | Toggles `logClientError` forwarding to `/logs/client`. Useful to disable in preview builds. |
| `NEXT_PUBLIC_LOG_TOKEN` | ➖ | *(unset)* | Token that must match backend `CLIENT_LOG_TOKEN` to accept client log posts. |
| `NEXT_IMAGE_UNOPTIMIZED` | ➖ | `true` | When `true`, disables Next image optimizer (avoid 400s on shared hosts). Set to `false` to enable optimization. |
| `NEXT_HTML_NOSTORE` | ➖ | `false` | When `true`, adds `no-store` headers for HTML on `dev.salon-bw.pl` to prevent stale pages. Build-time flag. |
| `NEXT_PANEL_HTML_NOSTORE` | ➖ | `false` | When `true`, adds `no-store` headers for HTML on `panel.salon-bw.pl`. Build-time flag. |
| `INSTAGRAM_ACCESS_TOKEN` | ➖ | *(unset)* | Server‑side Instagram Basic Display API long‑lived token used by the Gallery page to fetch media. |

### Analytics Events (GA4)

- `page_view` – automatic when navigation occurs (we disable auto page view and emit manually).
- `begin_checkout` – fired when user clicks Book Now (navbar or FAB).
- `purchase` – fired when an appointment is created or completed; includes:
  - `value` (PLN), `currency`, `items[]` with `item_id`, `item_name`, `item_category`.

Enable analytics by setting `NEXT_PUBLIC_ENABLE_ANALYTICS=true` and `NEXT_PUBLIC_GA_ID`.

## Secrets Handling

- Never commit `.env*` files containing real secrets.
- For shared environments (staging/production), store values in the hosting provider’s secret manager and update this document when new variables are introduced.
- Rotate tokens (`JWT_*`, `WHATSAPP_*`, API keys) if you suspect leakage.

## Verification Checklist

After updating environment values:

1. Run `pnpm tunnel:start` (if you need remote DB access) and ensure `pnpm be:dev` successfully connects.
2. From `frontend/`, run `pnpm dev` and confirm requests hit the expected backend URL.
3. Hit `/healthz` on the backend (`curl http://localhost:3001/healthz`) to verify the database check passes.
