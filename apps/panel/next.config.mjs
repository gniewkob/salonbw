// Static security headers applied to every panel response.
//
// CSP notes:
// - `script-src` is strict: `'self'` + GA loaders. `'unsafe-inline'` and
//   `'unsafe-eval'` are NOT present. Next.js Pages router in this panel
//   does not emit inline `<script>` blocks (the only one that used to
//   exist was the gtag bootstrap; it now runs via `onLoad` from the
//   external gtag.js script, which sits inside the React bundle and
//   does not need an inline `<script>` element). `__NEXT_DATA__` is
//   served with `type="application/json"` and so does not match
//   `script-src` per spec.
// - `style-src` still keeps `'unsafe-inline'`: many UI libraries
//   (react-datepicker, recharts, etc.) emit inline `style=...` props.
//   That's a real attack surface (no `expression()` in modern browsers)
//   but constrained enough to live with until a styled-components/JSS
//   migration replaces inline styles.
// - `frame-ancestors 'none'` / `frame-src 'none'`: no embed of, or by,
//   the panel after the vendored Versum calendar deletion.
// - `connect-src` lists the origins the SPA legitimately talks to:
//   - 'self' covers the same-origin proxy at /api/[...path]
//   - https://api.salon-bw.pl is the direct API origin used when
//     NEXT_PUBLIC_API_URL points there (CORS, credentials: 'include')
//   - sentry.io ingest hosts for error/perf telemetry
//   - google-analytics for gtag (only loaded when NEXT_PUBLIC_GA_ID is set)
// - `object-src 'none'`, `base-uri 'self'`, `form-action 'self' …` shut
//   down the highest-impact injection primitives.
const csp = [
    "default-src 'self'",
    "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' https://api.salon-bw.pl https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://www.google-analytics.com",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://api.salon-bw.pl",
    "base-uri 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // DENY — after deleting the vendored calendar embed there is no
    // legitimate same-origin iframe of panel pages. Matches the CSP
    // `frame-ancestors 'none'` directive above.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    { key: 'Content-Security-Policy', value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@salonbw/api'], // Validation: Force compilation of local TS package
    reactStrictMode: true,
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    // Image optimization configuration
    // Enable optimization by default, can be disabled with NEXT_IMAGE_UNOPTIMIZED=true for shared hosting
    images: {
        unoptimized: true, // process.env.NEXT_IMAGE_UNOPTIMIZED === 'true', // Forced to true for MyDevil (no sharp)
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60, // Cache optimized images for 60 seconds
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'scontent.cdninstagram.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'cdninstagram.com',
                pathname: '/**',
            },
        ],
    },
    typedRoutes: false,
    async rewrites() {
        const rules = [
            // Legacy source paths (from `panel.versum.com/<slug>/customers*`)
            // The vendored Versum calendar embed used to live under
            // /salonbw-{calendar,vendor}/ + /salonblackandwhite/{events,graphql,
            // track_new_events,settings/timetable/schedules} — those rewrites
            // were removed together with /api/calendar-embed; the React
            // calendar at /calendar uses native backend endpoints.
            {
                source: '/salonblackandwhite/customers',
                destination: '/customers',
            },
            {
                source: '/salonblackandwhite/customers/:path*',
                destination: '/customers/:path*',
            },
            {
                source: '/salonblackandwhite/calendar/views',
                destination: '/calendar/views',
            },
            {
                source: '/salonblackandwhite/calendar/views/new',
                destination: '/calendar/views/new',
            },
            {
                source: '/salonblackandwhite/services/new',
                destination: '/services/new',
            },
            {
                source: '/salonblackandwhite/settings/branch',
                destination: '/settings/branch',
            },
            {
                source: '/salonblackandwhite/settings/calendar',
                destination: '/settings/calendar',
            },
            {
                source: '/salonblackandwhite/settings/customer_groups',
                destination: '/settings/customer_groups',
            },
            {
                source: '/salonblackandwhite/settings/customer_groups/new',
                destination: '/settings/customer_groups/new',
            },
            {
                source: '/salonblackandwhite/event_reminders',
                destination: '/event-reminders',
            },
            {
                source: '/salonblackandwhite/event_reminders/edit',
                destination: '/event-reminders?edit=1',
            },
            {
                source: '/salonblackandwhite/settings/categories',
                destination: '/settings/categories',
            },
            {
                source: '/salonblackandwhite/settings/categories/new',
                destination: '/settings/categories/new',
            },
            {
                source: '/salonblackandwhite/settings/customer_origins',
                destination: '/settings/customer-origins',
            },
            {
                source: '/salonblackandwhite/settings/customer_panel/settings',
                destination: '/settings/customer-panel',
            },
            {
                source: '/salonblackandwhite/settings/data_protection',
                destination: '/settings/data-protection',
            },
            {
                source: '/salonblackandwhite/settings/employees',
                destination: '/settings/employees',
            },
            {
                source: '/salonblackandwhite/settings/employees/new',
                destination: '/settings/employees/new',
            },
            {
                source: '/salonblackandwhite/settings/employees/activity_logs',
                destination: '/settings/employees/activity-logs',
            },
            {
                source: '/salonblackandwhite/settings/employees/commissions',
                destination: '/settings/employees/commissions',
            },
            {
                source: '/salonblackandwhite/settings/employees/commissions/:id',
                destination: '/settings/employees/commissions/:id',
            },
            {
                source: '/salonblackandwhite/settings/employees/:id/edit',
                destination: '/settings/employees/:id/edit',
            },
            {
                source: '/salonblackandwhite/settings/employees/:id/events_history',
                destination: '/settings/employees/:id/events-history',
            },
            {
                source: '/salonblackandwhite/settings/employees/:id',
                destination: '/settings/employees/:id',
            },
            {
                source: '/salonblackandwhite/settings/extra_fields',
                destination: '/settings/extra-fields',
            },
            {
                source: '/salonblackandwhite/settings/payment_configuration',
                destination: '/settings/payment-configuration',
            },
            {
                source: '/salonblackandwhite/settings/sms',
                destination: '/settings/sms',
            },
            {
                source: '/salonblackandwhite/settings/timetable/employees',
                destination: '/settings/timetable/employees',
            },
            {
                source: '/salonblackandwhite/settings/timetable/employees/copy',
                destination: '/settings/timetable/employees/copy',
            },
            {
                source: '/salonblackandwhite/settings/timetable/employees/:id',
                destination: '/settings/timetable/employees/:id',
            },
            {
                source: '/salonblackandwhite/settings/timetable/templates',
                destination: '/settings/timetable/templates',
            },
            {
                source: '/salonblackandwhite/settings/timetable/branch',
                destination: '/settings/timetable/branch',
            },
            {
                source: '/salonblackandwhite/settings/trades/new',
                destination: '/settings/trades/new',
            },
            {
                source: '/salonblackandwhite/helps',
                destination: '/helps/new',
            },
            {
                source: '/salonblackandwhite/helps/new',
                destination: '/helps/new',
            },

            // Other modules
            {
                source: '/statistics/dashboard',
                destination: '/statistics',
            },
            // /events, /graphql, /track_new_events.json,
            // /settings/timetable/schedules/* used to be rewritten to /api/*
            // because the vendored Versum calendar embed called them as
            // top-level paths. After deleting /api/calendar-embed those
            // rewrites are unused — the React calendar talks to the
            // backend through the canonical /api/* proxy directly.
            {
                source: '/fresh_chat_user',
                destination: '/api/fresh_chat_user',
            },
            {
                source: '/todo/alerts',
                destination: '/api/todo/alerts',
            },
            // API requests now go through /pages/api/[...path].ts
            // which injects Authorization header from accessToken cookie
        ];
        return {
            beforeFiles: [],
            afterFiles: rules,
            fallback: [],
        };
    },
    async redirects() {
        return [
            // /calendar-next was the React port that lived alongside the
            // vendored Versum embed at /calendar. The embed is gone, the
            // React port took /calendar's slot — keep this redirect so old
            // bookmarks / browser history still land on the right page.
            {
                source: '/calendar-next',
                destination: '/calendar',
                permanent: true,
            },
            // Legacy customers aliases (compat)
            {
                source: '/clients',
                destination: '/customers',
                permanent: false,
            },
            {
                source: '/clients/:path*',
                destination: '/customers/:path*',
                permanent: false,
            },
            {
                source: '/usage',
                destination: '/use/history',
                permanent: false,
            },
            {
                source: '/usage/:path*',
                destination: '/use/:path*',
                permanent: false,
            },
            {
                source: '/admin/clients',
                destination: '/customers',
                permanent: false,
            },
            {
                source: '/admin/clients/:path*',
                destination: '/customers/:path*',
                permanent: false,
            },
            {
                source: '/admin/customers',
                destination: '/customers',
                permanent: false,
            },
            {
                source: '/admin/customers/:path*',
                destination: '/customers/:path*',
                permanent: false,
            },
            {
                source: '/admin/statistics',
                destination: '/statistics',
                permanent: false,
            },
            {
                source: '/admin/communications',
                destination: '/communication',
                permanent: false,
            },
            {
                source: '/admin/services',
                destination: '/services',
                permanent: false,
            },
            {
                source: '/admin/settings',
                destination: '/settings',
                permanent: false,
            },
            {
                source: '/signout',
                destination: '/auth/login',
                permanent: false,
            },
            {
                source: '/settings/payment_configuration',
                destination: '/settings/payment-configuration',
                permanent: false,
            },
            {
                source: '/settings/customer_origins',
                destination: '/settings/customer-origins',
                permanent: false,
            },
            {
                source: '/settings/data_protection',
                destination: '/settings/data-protection',
                permanent: false,
            },
            {
                source: '/settings/extra_fields',
                destination: '/settings/extra-fields',
                permanent: false,
            },
            {
                source: '/settings/employees/activity_logs',
                destination: '/settings/employees/activity-logs',
                permanent: false,
            },
            {
                source: '/settings/customer_groups',
                destination: '/settings/customer-groups',
                permanent: false,
            },
            {
                source: '/settings/customer_groups/new',
                destination: '/settings/customer-groups/new',
                permanent: false,
            },
            {
                source: '/notifications',
                destination: '/communication',
                permanent: false,
            },
            {
                source: '/settings/customer-panel',
                destination: '/settings/online-booking',
                permanent: false,
            },
            {
                source: '/settings/reminders',
                destination: '/event-reminders',
                permanent: false,
            },
            {
                source: '/settings/employees/:id/edit',
                destination: '/settings/employees/:id?tab=edit',
                permanent: false,
            },
            {
                source: '/settings/employees/:id/events-history',
                destination: '/settings/employees/:id?tab=history',
                permanent: false,
            },
        ];
    },
    async headers() {
        const rules = [
            // Global security headers (X-Frame-Options is SAMEORIGIN here, so
            // /api/calendar-embed no longer needs a per-route override).
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
            // Cache aggressively for fingerprinted Next.js assets
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // Cache images served via Next's image optimizer
            {
                source: '/_next/image',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // Cache versioned assets under /public/assets
            {
                source: '/assets/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // Robots hints on sensitive app areas
            {
                source: '/dashboard/:path*',
                headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
            },
            {
                source: '/auth/:path*',
                headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
            },
        ];

        // Dev-only: avoid stale HTML on dev host by disabling HTML caching.
        if (process.env.NEXT_HTML_NOSTORE === 'true') {
            rules.push({
                source: '/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'host',
                        value: 'dev\\.salon-bw\\.pl',
                    },
                    { type: 'header', key: 'accept', value: 'text/html.*' },
                ],
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            });
        }

        // Optionally disable HTML caching on panel host as well.
        if (process.env.NEXT_PANEL_HTML_NOSTORE === 'true') {
            rules.push({
                source: '/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'host',
                        value: 'panel\\.salon-bw\\.pl',
                    },
                    { type: 'header', key: 'accept', value: 'text/html.*' },
                ],
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            });
        }

        return rules;
    },
};

let exportConfig = nextConfig;
if (process.env.ANALYZE === 'true') {
    const mod = await import('@next/bundle-analyzer');
    const withBundleAnalyzer = mod.default({ enabled: true });
    exportConfig = withBundleAnalyzer(nextConfig);
}

export default exportConfig;
