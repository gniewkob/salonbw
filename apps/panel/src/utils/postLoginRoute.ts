import type { Role } from '@/types';

export function getPostLoginRoute(role: Role | null | undefined): string {
    if (role === 'client') {
        return '/booking';
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
