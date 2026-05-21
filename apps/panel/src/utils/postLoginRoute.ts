import type { Role } from '@/types';

export function getPostLoginRoute(role: Role | null | undefined): string {
    if (role === 'client') {
        return '/booking';
    }

    if (role === 'admin' || role === 'receptionist' || role === 'employee') {
        return '/calendar';
    }

    return '/dashboard';
}
