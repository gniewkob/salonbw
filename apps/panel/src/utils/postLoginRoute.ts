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
