import type { Role } from '@/types';

export type Permission =
    | 'dashboard:client'
    | 'dashboard:employee'
    | 'dashboard:receptionist'
    | 'dashboard:admin'
    | 'nav:appointments'
    | 'nav:calendar'
    | 'nav:invoices'
    | 'nav:reviews'
    | 'nav:customers'
    | 'nav:employees'
    | 'nav:products'
    | 'nav:services'
    | 'nav:warehouse'
    | 'nav:emails'
    | 'nav:statistics'
    | 'nav:communication'
    | 'nav:settings';

const rolePermissions: Record<Role, Set<Permission>> = {
    // Clients reach their modules via `dashboard:client` (dashboard + booking
    // rail) and role-based RouteGuards (booking.tsx is roles={['client']}).
    // nav:appointments/invoices/reviews were vestigial — the staff pages they
    // map to are role-blocked anyway, except /reviews which guards only on the
    // permission, so a client could load the (empty, 403-data) staff reviews
    // manager. Least privilege: dashboard:client only.
    client: new Set(['dashboard:client']),
    employee: new Set([
        'dashboard:employee',
        'nav:appointments',
        'nav:calendar',
        'nav:customers',
    ]),
    receptionist: new Set([
        'dashboard:receptionist',
        'nav:appointments',
        'nav:calendar',
        'nav:customers',
    ]),
    admin: new Set([
        'dashboard:admin',
        'nav:appointments',
        'nav:calendar',
        'nav:customers',
        'nav:employees',
        'nav:products',
        'nav:services',
        'nav:warehouse',
        'nav:emails',
        'nav:statistics',
        'nav:communication',
        'nav:settings',
        'nav:invoices',
        'nav:reviews',
    ]),
};

export function can(
    role: Role | null | undefined,
    permission: Permission,
): boolean {
    if (!role) return false;
    const permissions = rolePermissions[role];
    return permissions?.has(permission) ?? false;
}

export function permissionsFor(role: Role | null | undefined): Permission[] {
    if (!role) return [];
    return Array.from(rolePermissions[role] ?? []);
}
