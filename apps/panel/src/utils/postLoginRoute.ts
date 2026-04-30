import type { Role } from '@/types';

export function getPostLoginRoute(role: Role | null | undefined): string {
    if (role === 'client') {
        return '/dashboard';
    }

    if (role === 'admin' || role === 'receptionist') {
        return '/calendar-next';
    }

    if (role === 'employee') {
        return '/calendar';
    }

    return '/dashboard';
}
