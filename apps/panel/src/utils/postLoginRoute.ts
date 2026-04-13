import type { Role } from '@/types';

export function getPostLoginRoute(role: Role | null | undefined): string {
    if (role === 'customer') {
        return '/dashboard';
    }

    if (role === 'admin' || role === 'employee' || role === 'receptionist') {
        return '/calendar';
    }

    return '/dashboard';
}
