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

const ROLE_HOME: Record<string, string> = {
    client: '/dashboard/client',
    employee: '/dashboard/employee',
    receptionist: '/dashboard/receptionist',
    admin: '/dashboard/admin',
};

function decodeRole(token: string | undefined | null): string | null {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
        const role = payload.role as string | undefined;
        return ROLE_HOME[role ?? ''] ? role ?? null : null;
    } catch {
        return null;
    }
}

function preferLocalePath(pathname: string) {
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }
    return pathname;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const path = preferLocalePath(pathname);

    const accessToken = request.cookies.get('jwtToken')?.value;
    const role = decodeRole(accessToken);
    const isAuthenticated = Boolean(role);

    const isPublic = PUBLIC_ROUTES.includes(path);
    const isAuthRoute = AUTH_ROUTES.includes(path);
    const isDashboard = path.startsWith(DASHBOARD_PREF);

    if (isPublic) {
        return NextResponse.next();
    }

    if (isAuthRoute) {
        if (isAuthenticated) {
            const target = ROLE_HOME[role ?? ''] ?? '/dashboard';
            return NextResponse.redirect(new URL(target, request.url));
        }
        return NextResponse.next();
    }

    if (isDashboard && !isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(loginUrl);
    }

    if (isDashboard && isAuthenticated) {
        const [, , section] = path.split('/');
        if (!section) {
            const target = ROLE_HOME[role ?? ''] ?? '/dashboard';
            if (path !== target) {
                return NextResponse.redirect(new URL(target, request.url));
            }
            return NextResponse.next();
        }
        const allowedSegments = new Set(
            Object.entries(ROLE_HOME)
                .filter(([, home]) => home.startsWith(`/dashboard/${section}`))
                .map(([r]) => r),
        );
        if (allowedSegments.size === 0) {
            return NextResponse.next();
        }
        if (!allowedSegments.has(role ?? '')) {
            const target = ROLE_HOME[role ?? ''] ?? '/dashboard';
            return NextResponse.redirect(new URL(target, request.url));
        }
    }

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
