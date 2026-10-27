import type { Role } from '@/types';

export function getPostLoginRoute(role: Role | null | undefined): string {
    // Clients land on their panel (upcoming/past visits + a prominent
    // "Zarezerwuj wizytę" CTA), reachable again via the "moje wizyty" rail.
    if (role === 'client') {
        return '/dashboard';
    }

    // Admin trafia na dashboard z KPI dnia / online_pending / alerty.
    // Receptionist + employee idą bezpośrednio do kalendarza (ich główne narzędzie).
    if (role === 'admin') {
        return '/dashboard';
    }

    if (role === 'receptionist' || role === 'employee') {
        return '/calendar';
    }

    return '/dashboard';
}

// Registration may return to booking only, never to an external URL.
export function getBookingRedirect(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value, 'https://panel.invalid');
        if (
            url.origin !== 'https://panel.invalid' ||
            url.pathname !== '/booking'
        )
            return null;
        return url.pathname + url.search;
    } catch {
        return null;
    }
}

/**
 * Only relative, same-origin application routes may be used after login.
 * The login page previously forwarded an untrusted router.query.redirect
 * directly to router.push, including potential protocol-relative/external URLs.
 * Keep existing internal deep links but reject external, auth-loop and
 * ambiguous backslash/encoded-leading-slash input.
 */
export function getSafeLocalRedirect(value: unknown): string | null {
    if (typeof value !== 'string' || value !== value.trim()) return null;
    if (
        !value.startsWith('/') ||
        value.startsWith('//') ||
        value.includes('\\') ||
        /[\u0000-\u001F\u007F]/.test(value) ||
        /^\/%(?:2f|5c)/i.test(value)
    ) {
        return null;
    }
    try {
        const route = new URL(value, 'https://panel.invalid');
        if (
            route.origin !== 'https://panel.invalid' ||
            route.pathname === '/auth' ||
            route.pathname.startsWith('/auth/')
        ) {
            return null;
        }
        return route.pathname + route.search + route.hash;
    } catch {
        return null;
    }
}
