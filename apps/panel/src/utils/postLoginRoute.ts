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
