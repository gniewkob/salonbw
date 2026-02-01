import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
