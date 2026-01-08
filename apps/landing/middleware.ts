import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname: path } = request.nextUrl;

    // Explicitly block standard dashboard routes if they somehow exist
    if (path.startsWith('/dashboard') || path.startsWith('/settings')) {
         return new NextResponse(null, { status: 404 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
