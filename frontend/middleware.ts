import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

    // Check for backend-issued session cookies
    const hasAccessToken = request.cookies.has('accessToken');
    const hasMarker =
        request.cookies.get('sbw_auth')?.value === '1' ||
        request.cookies.has('refreshToken');
    const isAuthenticated = hasAccessToken || hasMarker;

    const isPublic = PUBLIC_ROUTES.includes(path);
    const isAuthRoute = AUTH_ROUTES.includes(path);
    const isDashboard = path.startsWith(DASHBOARD_PREF);

    // Allow access to public routes
    if (isPublic) {
        return NextResponse.next();
    }

    // Handle auth routes
    if (isAuthRoute) {
        if (isAuthenticated) {
            // Redirect authenticated users from auth pages to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Handle dashboard access
    if (isDashboard && !isAuthenticated) {
        // Store the intended path for post-login redirect
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(loginUrl);
    }

    // All other routes
    return NextResponse.next();
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
