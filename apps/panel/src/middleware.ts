import { developmentAccessAllowed } from '@salonbw/api';
import { authCookieName } from '@/utils/authCookieName';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function isPublicDashboardAssetPath(path: string) {
    return (
        path === '/__release.json' ||
        path.startsWith('/_next') ||
        path.startsWith('/assets') ||
        path.startsWith('/favicon.ico') ||
        path.startsWith('/api') ||
        path.startsWith('/icon')
    );
}

export async function middleware(request: NextRequest) {
    // Owner-authorized DEV preview window, ending automatically on 11 Nov 2026.
    // The application session check below remains mandatory.
    const host = request.headers.get('host')?.toLowerCase().split(':')[0];
    const previewWindow =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' &&
        process.env.APP_ENV === 'development' &&
        host === 'dev-panel.salon-bw.pl' &&
        Date.now() < Date.parse('2026-11-11T17:15:00.000Z');

    if (
        !previewWindow &&
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

    // Check if user is authenticated via cookie
    const legacyToken =
        authCookieName('accessToken') === 'accessToken'
            ? request.cookies.get('token')?.value
            : undefined;
    const accessToken = request.cookies.get(
        authCookieName('accessToken'),
    )?.value;
    const refreshToken = request.cookies.get(
        authCookieName('refreshToken'),
    )?.value;
    const sessionFlag = request.cookies.get(authCookieName('sbw_auth'))?.value;
    const isAuthenticated = Boolean(
        legacyToken || accessToken || refreshToken || sessionFlag,
    );

    // Define public routes
    const isAuthRoute = path.startsWith('/auth');
    const isPublicAsset = isPublicDashboardAssetPath(path); // icon.ico/svg

    // Allow public access to auth pages and assets
    if (isAuthRoute || isPublicAsset) {
        return NextResponse.next();
    }

    // Require authentication for everything else (Dashboard, etc.)
    if (!isAuthenticated) {
        // Strict redirect for root path
        if (path === '/') {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    if (process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development')
        response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
