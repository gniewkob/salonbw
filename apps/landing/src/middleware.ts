import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isCanonicalHost } from '@/utils/robots';

export function middleware(request: NextRequest) {
    const { pathname: path } = request.nextUrl;

    const panelOnlyPrefixes = [
        '/auth',
        '/appointments',
        '/dashboard',
        '/admin',
        '/clients',
        '/employees',
        '/invoices',
        '/notifications',
        '/products',
        '/reviews',
        '/calendar',
        '/emails',
        '/settings',
    ];

    if (
        panelOnlyPrefixes.some(
            (prefix) => path === prefix || path.startsWith(`${prefix}/`),
        )
    ) {
        const base =
            process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.salon-bw.pl';
        const destination = new URL(base);
        const targetPath =
            path === '/auth' || path === '/auth/' ? '/auth/login' : path;
        destination.pathname = targetPath;
        destination.search = request.nextUrl.search;
        return NextResponse.redirect(destination, 308);
    }

    const response = NextResponse.next();
    // Every host other than the canonical site serves a copy (today dev.,
    // after the cutover the development environment). Keep those out of the
    // index; robots.txt alone does not stop an already-linked URL.
    if (!isCanonicalHost(request.headers.get('host'))) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
