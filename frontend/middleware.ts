import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const PUBLIC_ROUTES = [
    '/',
    '/about',
    '/services',
    '/gallery',
    '/contact',
    '/policy',
    '/privacy',
    '/faq',
];

const AUTH_ROUTES = ['/auth/login', '/auth/register'];

const DASHBOARD_PREF = '/dashboard';

function preferLocalePath(pathname: string) {
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }
    return pathname;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const path = preferLocalePath(pathname);

    // Generate a unique nonce for this request (CSP)
    const nonce = crypto.randomBytes(16).toString('base64');

    // Check for backend-issued session cookies
    const hasAccessToken = request.cookies.has('accessToken');
    const hasMarker =
        request.cookies.get('sbw_auth')?.value === '1' ||
        request.cookies.has('refreshToken');
    const isAuthenticated = hasAccessToken || hasMarker;

    const isPublic = PUBLIC_ROUTES.includes(path);
    const isAuthRoute = AUTH_ROUTES.includes(path);
    const isDashboard = path.startsWith(DASHBOARD_PREF);

    // Create CSP header with nonce
    const cspHeader = generateCSP(nonce);

    // Allow access to public routes
    if (isPublic) {
        const response = NextResponse.next();
        response.headers.set('Content-Security-Policy', cspHeader);
        response.headers.set('x-nonce', nonce);
        return response;
    }

    // Handle auth routes
    if (isAuthRoute) {
        if (isAuthenticated) {
            // Redirect authenticated users from auth pages to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        const response = NextResponse.next();
        response.headers.set('Content-Security-Policy', cspHeader);
        response.headers.set('x-nonce', nonce);
        return response;
    }

    // Handle dashboard access
    if (isDashboard && !isAuthenticated) {
        // Store the intended path for post-login redirect
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(loginUrl);
    }

    // All other routes
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-nonce', nonce);
    return response;
}

function generateCSP(nonce: string): string {
    // Get API URL from environment or default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.salon-bw.pl';

    const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
        `style-src 'self' 'nonce-${nonce}' https:`,
        "img-src 'self' data: blob: https:",
        "media-src 'self' https:",
        "font-src 'self' data:",
        "connect-src 'self' https: wss:",
        "frame-src 'self' https://*.google.com https://*.gstatic.com",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "upgrade-insecure-requests",
        `report-uri ${apiUrl}/csp-report`,
    ];
    return csp.join('; ');
}

export const config = {
    matcher: [
        '/',
        '/about',
        '/services',
        '/gallery',
        '/contact',
        '/policy',
        '/privacy',
        '/faq',
        '/auth/:path*',
        '/dashboard/:path*',
    ],
};
