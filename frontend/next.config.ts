import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    eslint: { ignoreDuringBuilds: true },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'"
                    },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
                ]
            }
        ]
    }
};

export default nextConfig;
