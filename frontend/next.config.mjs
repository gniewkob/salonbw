const ContentSecurityPolicy = [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;",
    "style-src 'self' 'unsafe-inline' https:;",
    "img-src 'self' data: blob: https:;",
    "media-src 'self' https:;",
    "font-src 'self' data:;",
    "connect-src 'self' https: wss:;",
    // Allow embedding specific, trusted frames (e.g., Google Maps embeds)
    "frame-src 'self' https://*.google.com https://*.gstatic.com;",
    "frame-ancestors 'none';",
    "form-action 'self';",
    "base-uri 'self';",
].join(' ');

const securityHeaders = [
    { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
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
    reactStrictMode: true,
    eslint: { ignoreDuringBuilds: true },
    output: 'standalone',
    // Configure image optimization; default to unoptimized on mydevil to avoid 400s
    // from the on-host optimizer. Can be overridden by NEXT_IMAGE_UNOPTIMIZED=false.
    images: { unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED !== 'false' },
    experimental: {
        typedRoutes: false,
    },
    transpilePackages: ['@salonbw/api'],
    async rewrites() {
        const target = process.env.API_PROXY_URL || 'https://api.salon-bw.pl';
        return [
            {
                source: '/api/:path*',
                destination: `${target.replace(/\/$/, '')}/:path*`,
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
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            // Cache images served via Next's image optimizer
            {
                source: '/_next/image',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            // Cache versioned assets under /public/assets
            {
                source: '/assets/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
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
                    { type: 'header', key: 'host', value: 'dev\\.salon-bw\\.pl' },
                    { type: 'header', key: 'accept', value: 'text/html.*' },
                ],
                headers: [
                    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
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
                    { type: 'header', key: 'host', value: 'panel\\.salon-bw\\.pl' },
                    { type: 'header', key: 'accept', value: 'text/html.*' },
                ],
                headers: [
                    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
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
