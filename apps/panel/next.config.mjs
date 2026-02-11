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
    experimental: {
        typedRoutes: false,
    },
    async rewrites() {
        const target = process.env.API_PROXY_URL || 'https://api.salon-bw.pl';
        return [
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
            // API requests now go through /pages/api/[...path].ts
            // which injects Authorization header from accessToken cookie
        ];
    },
    async redirects() {
        return [
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
