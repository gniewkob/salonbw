import { developmentAccessAllowed } from '@salonbw/api';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isWwwHost, resolveLegacyRedirect } from '@/utils/legacyRedirects';
import { isCanonicalHost, resolveSiteUrl } from '@/utils/robots';

export async function middleware(request: NextRequest) {
    if (
        !(await developmentAccessAllowed(request.headers.get('authorization')))
    ) {
        return new NextResponse('Development access required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="SalonBW development"',
                'X-Robots-Tag': 'noindex, nofollow, noarchive',
            },
        });
    }
    const { pathname: path } = request.nextUrl;
    const panelUrl =
        process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.salon-bw.pl';

    // Legacy URLs of the old PHP site (54 indexed pages) → closest page here,
    // or the panel for the old booking modal. Resolved before the www hop so
    // www.salon-bw.pl/kontakt reaches /contact in a single redirect.
    const hostHeader = request.headers.get('host');
    const legacyTarget = resolveLegacyRedirect(path, panelUrl);
    const wwwHost = isWwwHost(hostHeader);
    if (legacyTarget || wwwHost) {
        // Passenger proxies plain HTTP, so nextUrl.origin is not reliable for
        // public redirects; build them from the Host header over HTTPS.
        const base =
            wwwHost || !hostHeader ? resolveSiteUrl() : `https://${hostHeader}`;
        const destination = new URL(legacyTarget ?? path, base);
        if (!legacyTarget) {
            destination.search = request.nextUrl.search;
        }
        return NextResponse.redirect(destination, 301);
    }

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
        const destination = new URL(panelUrl);
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
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
