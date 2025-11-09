# Security Headers & Robots Policy

This document outlines the HTTP response headers and crawler directives applied by the Next.js frontend.

## Global HTTP Headers

### Content Security Policy (CSP)

**NEW (2025-11-01):** CSP is now dynamically generated with nonces via `frontend/middleware.ts` for enhanced security.

**Strict CSP Configuration:**
- `default-src 'self'` - Only allow resources from same origin
- `script-src 'self' 'nonce-{random}' 'strict-dynamic' https:` - **No unsafe-inline or unsafe-eval**
- `style-src 'self' 'nonce-{random}' https:` - Nonce-based styles
- `img-src 'self' data: blob: https:` - Allow images from trusted sources
- `media-src 'self' https:` - Media from HTTPS only
- `font-src 'self' data:` - Fonts from same origin or data URIs
- `connect-src 'self' https: wss:` - API and WebSocket connections
- `frame-src 'self' https://*.google.com https://*.gstatic.com` - Trusted embeds only
- `frame-ancestors 'none'` - Prevent clickjacking
- `form-action 'self'` - Forms submit to same origin only
- `base-uri 'self'` - Restrict base tag URLs
- `upgrade-insecure-requests` - Auto-upgrade HTTP to HTTPS
- `report-uri {API_URL}/csp-report` - Violation reporting endpoint

**How it works:**
1. Middleware generates a unique nonce for each request
2. Nonce is passed to `<Head>` and `<NextScript>` via `_document.tsx`
3. Next.js automatically applies nonces to `<Script>` components
4. CSP violations are logged to backend at `/csp-report`

### Static Security Headers

Configured in `frontend/next.config.mjs`:
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
