const ContentSecurityPolicy = [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;",
    "style-src 'self' 'unsafe-inline' https:;",
    "img-src 'self' data: blob: https:;",
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
    // Enable Next.js image optimization for better Core Web Vitals.
    images: { unoptimized: false },
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
        return [
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
    },
};

let exportConfig = nextConfig;
if (process.env.ANALYZE === 'true') {
    const mod = await import('@next/bundle-analyzer');
    const withBundleAnalyzer = mod.default({ enabled: true });
    exportConfig = withBundleAnalyzer(nextConfig);
}

export default exportConfig;
