// CSP is now handled by middleware.ts with nonce generation
// Only include static security headers here
const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
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
            // Legacy Versum compatibility aliases (vendored calendar runtime uses these in some flows)
            // Note: Next rewrites do not reliably chain, so map to `/api/*` directly.
            {
                source: '/salonblackandwhite/events/:path*',
                destination: '/api/events/:path*',
            },
            {
                source: '/salonblackandwhite/settings/timetable/schedules/:path*',
                destination: '/api/settings/timetable/schedules/:path*',
            },
            {
                source: '/salonblackandwhite/track_new_events.json',
                destination: '/api/track_new_events.json',
            },
            {
                source: '/salonblackandwhite/graphql',
                destination: '/api/graphql',
            },

            // Calendar embed is handled by `src/pages/calendar.tsx`, which replaces the document
            // with HTML served by `/api/calendar-embed` to avoid hydration conflicts.
            // Versum legacy paths (from `panel.versum.com/<slug>/customers*`)
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
                source: '/salonblackandwhite/settings/employees',
                destination: '/settings/employees',
            },
            {
                source: '/salonblackandwhite/settings/employees/activity_logs',
                destination: '/settings/employees/activity_logs',
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
                source: '/salonblackandwhite/settings/timetable/templates',
                destination: '/settings/timetable/templates',
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
            {
                source: '/events/:path*',
                destination: '/api/events/:path*',
            },
            {
                source: '/settings/timetable/schedules/:path*',
                destination: '/api/settings/timetable/schedules/:path*',
            },
            {
                source: '/track_new_events.json',
                destination: '/api/track_new_events.json',
            },
            {
                source: '/graphql',
                destination: '/api/graphql',
            },
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
        ];
    },
    async headers() {
        const rules = [
            // Global security headers
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
