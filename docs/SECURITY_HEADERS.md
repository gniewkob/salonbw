# Security Headers & Robots Policy

This document outlines the HTTP response headers and crawler directives applied by the Next.js frontend.

## Global HTTP Headers

Configured in `frontend/next.config.mjs` for every request:

- `Content-Security-Policy` – restricts resource loading to trusted origins:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`
  - `style-src 'self' 'unsafe-inline' https:`
  - `img-src 'self' data: blob: https:`
  - `font-src 'self' data:`
  - `connect-src 'self' https: wss:` (permits API and WebSocket calls)
  - `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

## Performance Caching

Additional caching headers are applied to reduce bandwidth and improve page load times:

- `/_next/static/*` – `Cache-Control: public, max-age=31536000, immutable`
- `/_next/image` – `Cache-Control: public, max-age=31536000, immutable`
- `/assets/*` – `Cache-Control: public, max-age=31536000, immutable`

These targets are fingerprinted or versioned, making them safe to cache for a year. HTML and API responses remain non-cacheable by default.

## Dashboard / Auth Protections

Requests under `/dashboard/*` and `/auth/*` receive an additional header:

- `X-Robots-Tag: noindex, nofollow`

This prevents private panel routes from being indexed by search engines even if accidentally exposed.

## Robots.txt

`frontend/public/robots.txt` instructs crawlers to index public pages while omitting privileged areas:

```
User-agent: *
Allow: /
Disallow: /auth/
Disallow: /dashboard/
```

Update the disallow list if new sensitive sections are added (e.g. `/admin/`).

## Verification Steps

1. Run `pnpm build` to ensure the Next.js config parses correctly.
2. In development, inspect responses via browser devtools or `curl -I http://localhost:3000/` to validate headers.
3. For `/dashboard` or `/auth` paths, confirm the `X-Robots-Tag` header is present.
4. Fetch `/robots.txt` to verify crawler directives.
