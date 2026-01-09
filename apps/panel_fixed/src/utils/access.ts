import type { Role } from '@/types';

export type Permission =
    | 'dashboard:client'
    | 'dashboard:employee'
    | 'dashboard:receptionist'
    | 'dashboard:admin'
    | 'nav:appointments'
    | 'nav:invoices'
    | 'nav:reviews'
    | 'nav:clients'
    | 'nav:employees'
    | 'nav:products'
    | 'nav:services'
    | 'nav:emails';

const rolePermissions: Record<Role, Set<Permission>> = {
    client: new Set([
        'dashboard:client',
        'nav:appointments',
        'nav:invoices',
        'nav:reviews',
    ]),
    employee: new Set([
        'dashboard:employee',
        'nav:appointments',
        'nav:clients',
    ]),
    receptionist: new Set(['dashboard:receptionist', 'nav:appointments']),
    admin: new Set([
        'dashboard:admin',
        'nav:appointments',
        'nav:clients',
        'nav:employees',
        'nav:products',
        'nav:services',
        'nav:emails',
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
