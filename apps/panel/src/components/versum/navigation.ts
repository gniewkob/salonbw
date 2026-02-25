import type { Role } from '@/types';
import { can, type Permission } from '@/utils/access';

export type VersumModuleKey =
    | 'calendar'
    | 'customers'
    | 'products'
    | 'statistics'
    | 'communication'
    | 'services'
    | 'settings'
    | 'extension';

export interface VersumModule {
    key: VersumModuleKey;
    href: string;
    label: string;
    iconId: string;
    permission: Permission;
    secondaryNav: boolean;
    wideContent?: boolean;
    pinBottom?: boolean;
}

export const VERSUM_MODULES: VersumModule[] = [
    {
        key: 'calendar',
        href: '/calendar',
        label: 'kalendarz',
        iconId: 'svg-calendar-nav',
        permission: 'nav:calendar',
        secondaryNav: true,
        wideContent: true,
    },
    {
        key: 'customers',
        href: '/customers',
        label: 'klienci',
        iconId: 'svg-customers-nav',
        permission: 'nav:customers',
        secondaryNav: true, // Page has its own sidebar with dynamic content
        wideContent: true,
    },
    {
        key: 'products',
        href: '/products',
        label: 'magazyn',
        iconId: 'svg-stock-nav',
        permission: 'nav:products',
        secondaryNav: true,
        wideContent: true,
    },
    {
        key: 'statistics',
        href: '/statistics',
        label: 'statystyki',
        iconId: 'svg-statistics-nav',
        permission: 'nav:statistics',
        secondaryNav: true,
    },
    {
        key: 'communication',
        href: '/communication',
        label: 'łączność',
        iconId: 'svg-communication-nav',
        permission: 'nav:communication',
        secondaryNav: true,
        wideContent: true,
    },
    {
        key: 'services',
        href: '/services',
        label: 'usługi',
        iconId: 'svg-services-nav',
        permission: 'nav:services',
        secondaryNav: true,
        wideContent: true,
    },
    {
        key: 'settings',
        href: '/settings',
        label: 'ustawienia',
        iconId: 'svg-settings-nav',
        permission: 'nav:settings',
        secondaryNav: true,
    },
    {
        key: 'extension',
        href: '/extension',
        label: 'dodatki',
        iconId: 'svg-extensions-nav',
        permission: 'nav:extension',
        secondaryNav: false,
        pinBottom: true,
    },
];

export function resolveVersumModule(pathname: string): VersumModule {
    // Normalize path
    const path = pathname.toLowerCase();

    if (
        path.startsWith('/calendar') ||
        path.startsWith('/appointments') ||
        path.startsWith('/dashboard') ||
        path === '/'
    ) {
        return VERSUM_MODULES[0];
    }

    if (path.startsWith('/customers')) {
        return VERSUM_MODULES[1];
    }

    if (
        path.startsWith('/products') ||
        path.startsWith('/inventory') ||
        path.startsWith('/sales') ||
        path.startsWith('/use') ||
        path.startsWith('/usage') ||
        path.startsWith('/deliveries') ||
        path.startsWith('/orders') ||
        path.startsWith('/stock-alerts') ||
        path.startsWith('/suppliers') ||
        path.startsWith('/manufacturers') ||
        path.startsWith('/admin/warehouse')
    ) {
        return VERSUM_MODULES[2];
    }

    if (
        path.startsWith('/statistics') ||
        path.startsWith('/admin/statistics')
    ) {
        return VERSUM_MODULES[3];
    }

    if (
        path.startsWith('/communication') ||
        path.startsWith('/emails') ||
        path.startsWith('/admin/communications')
    ) {
        return VERSUM_MODULES[4];
    }

    if (path.startsWith('/services') || path.startsWith('/admin/services')) {
        return VERSUM_MODULES[5];
    }

    if (
        path.startsWith('/settings') ||
        path.startsWith('/admin/settings') ||
        path.startsWith('/employees')
    ) {
        return VERSUM_MODULES[6];
    }

    if (path.startsWith('/extension')) {
        return VERSUM_MODULES[7];
    }

    return VERSUM_MODULES[0];
}

export function visibleVersumModules(
    role: Role | null | undefined,
): VersumModule[] {
    if (!role) return [];
    return VERSUM_MODULES.filter((item) => can(role, item.permission));
}
