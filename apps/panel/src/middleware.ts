import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname: path } = request.nextUrl;

    // Check if user is authenticated via cookie
    const legacyToken = request.cookies.get('token')?.value;
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const sessionFlag = request.cookies.get('sbw_auth')?.value;
    const isAuthenticated = Boolean(
        legacyToken || accessToken || refreshToken || sessionFlag,
    );

    // Define public routes
    const isAuthRoute = path.startsWith('/auth');
    const isPublicAsset =
        path.startsWith('/_next') ||
        path.startsWith('/assets') ||
        path.startsWith('/versum-calendar') ||
        path.startsWith('/favicon.ico') ||
        path.startsWith('/api') ||
        path.startsWith('/events') ||
        path.startsWith('/graphql') ||
        path.startsWith('/settings/timetable/schedules') ||
        path.startsWith('/track_new_events.json') ||
        path.startsWith('/icon'); // icon.ico/svg

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

    return NextResponse.next();
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
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
