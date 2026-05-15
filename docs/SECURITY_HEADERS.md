# Security Headers & Robots Policy

This document outlines the HTTP response headers and crawler directives applied by the Next.js apps (landing + panel).

Last reviewed: 2026-05-15 (panel hardening pass — see `docs/PANEL_HARDENING_2026-05.md`).

## Global HTTP Headers (panel)

### Content Security Policy (CSP)

CSP is **statically configured** in `apps/panel/next.config.mjs` via
the `securityHeaders` array. There is no middleware-based nonce
generation today — this used to be promised by a stale comment in
`next.config.mjs` that pointed at `middleware.ts`, but no nonce code
ever existed there. The misleading comment was removed in commit
`19d01beb` and replaced with the documentation below.

**Current panel CSP:**

```
default-src 'self';
script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com;
img-src 'self' data: blob: https:;
media-src 'self' blob:;
connect-src 'self' https://api.salon-bw.pl https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://www.google-analytics.com;
frame-src 'none';
frame-ancestors 'none';
form-action 'self' https://api.salon-bw.pl;
base-uri 'self';
object-src 'none';
worker-src 'self' blob:;
manifest-src 'self';
upgrade-insecure-requests
```

#### Why each directive is shaped the way it is

- **`script-src`** — no `'unsafe-inline'`, no `'unsafe-eval'`. The
  panel emits only external `<script src=...>` tags (Next.js
  `_next/static/*` chunks) plus a `__NEXT_DATA__` block served as
  `type="application/json"`, which CSP `script-src` does not match.
  The only previous inline script (gtag bootstrap) was moved into a
  `Script onLoad={...}` handler in `apps/panel/src/pages/_app.tsx`
  in commit `0a447c39`.
- **`style-src`** keeps `'unsafe-inline'` because UI libraries
  (react-datepicker, recharts, Bootstrap) ship inline `style="…"`
  props. Replacing them needs a CSS-in-JS migration that is out of
  scope here.
- **`frame-src 'none'` + `frame-ancestors 'none'`** — the panel
  does not host, and is not embedded by, any iframe after the
  vendored Versum calendar embed (`/api/calendar-embed`) was
  deleted in commit `c5555384`. Matches `X-Frame-Options: DENY`.
- **`connect-src`** — explicitly lists every origin the SPA talks
  to: `'self'` (the same-origin proxy at `/api/[...path]`),
  `https://api.salon-bw.pl` (direct API origin used when
  `NEXT_PUBLIC_API_URL` points there), Sentry ingest hosts, and
  Google Analytics.
- **`object-src 'none'`, `base-uri 'self'`, `form-action 'self'
  https://api.salon-bw.pl`** — close the highest-impact injection
  primitives even if a future XSS bypasses script-src.

### Static Security Headers (panel)

Configured in `apps/panel/next.config.mjs`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (matches CSP `frame-ancestors 'none'`).
  This used to emit a conflicting `SAMEORIGIN` override for
  `/api/calendar-embed`; both were removed in `c5555384`.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

## Landing CSP

The landing app retains a separate, more permissive CSP because it
must embed third-party widgets (booking, social embeds, etc.).
See `apps/landing/next.config.mjs` for the canonical list. The
hardening described above applies to the panel only.

## Performance Caching

Additional caching headers are applied to reduce bandwidth and improve page load times:

- `/_next/static/*` – `Cache-Control: public, max-age=31536000, immutable`
- `/_next/image` – `Cache-Control: public, max-age=31536000, immutable`
- `/assets/*` – `Cache-Control: public, max-age=31536000, immutable`

These targets are fingerprinted or versioned, making them safe to cache for a year. HTML and API responses remain non-cacheable by default.

The embed handler at `/api/calendar-embed` no longer exists (deleted in `c5555384`); the previous note about caching that response is obsolete.

## Panel / Auth Protections

Requests under the panel routes `/dashboard/*` and `/auth/*` receive an additional header:

- `X-Robots-Tag: noindex, nofollow`

This prevents private panel routes from being indexed by search engines even if accidentally exposed. The public landing app redirects these paths to the panel, so indexing protections should be validated on the panel domain.

## Robots.txt

`apps/landing/public/robots.txt` instructs crawlers to index public pages while omitting privileged areas:

```
User-agent: *
Allow: /
Disallow: /auth/
Disallow: /dashboard/
```

Update the disallow list if new sensitive sections are added (e.g. `/admin/`). Panel routes are primarily protected via headers and auth middleware.

## Verification Steps

1. Run `pnpm --filter @salonbw/landing build` and `pnpm --filter @salonbw/panel build` to ensure the Next.js configs parse correctly.
2. In development, inspect responses via browser devtools or `curl -I http://localhost:3000/` (landing) and the panel dev port to validate headers.
3. For `/dashboard` or `/auth` paths on the panel domain, confirm the `X-Robots-Tag` header is present.
4. Fetch `/robots.txt` to verify crawler directives.
5. Smoke the live CSP on the panel:

```bash
curl -sI "https://panel.salon-bw.pl/auth/login?cb=$(uuidgen)" \
  | grep -iE "content-security|x-frame"
```

Expect `script-src` without `'unsafe-inline'` / `'unsafe-eval'`,
`X-Frame-Options: DENY`, and `frame-ancestors 'none'`.

## Future work

The remaining `'unsafe-inline'` on `style-src` is the next obvious
tightening. It requires moving inline `style="…"` props off of
react-datepicker / recharts / Bootstrap usage to className-driven
styles, or shipping nonces from middleware. Tracked separately.
