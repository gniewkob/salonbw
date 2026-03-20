import type { Role } from '@/types';
import { can, type Permission } from '@/utils/access';

export type SalonBWModuleKey =
    | 'calendar'
    | 'customers'
    | 'products'
    | 'statistics'
    | 'communication'
    | 'services'
    | 'settings'
    | 'extension'
    | 'helps';

export interface SalonBWModule {
    key: SalonBWModuleKey;
    href: string;
    label: string;
    iconId: string;
    permission: Permission;
    secondaryNav: boolean;
    wideContent?: boolean;
    pinBottom?: boolean;
}

export const SALONBW_MODULES: SalonBWModule[] = [
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
        wideContent: true,
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
        secondaryNav: true,
        pinBottom: true,
    },
];

const HELPS_MODULE: SalonBWModule = {
    key: 'helps',
    href: '/helps/new',
    label: 'pomoc',
    iconId: 'svg-help',
    permission: 'nav:settings',
    secondaryNav: false,
};

export function resolveSalonBWModule(pathname: string): SalonBWModule {
    // Normalize path
    const path = pathname.toLowerCase();

    if (
        path.startsWith('/calendar') ||
        path.startsWith('/appointments') ||
        path.startsWith('/dashboard') ||
        path === '/'
    ) {
        return SALONBW_MODULES[0];
    }

    if (path.startsWith('/customers')) {
        return SALONBW_MODULES[1];
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
        return SALONBW_MODULES[2];
    }

    if (
        path.startsWith('/statistics') ||
        path.startsWith('/admin/statistics')
    ) {
        return SALONBW_MODULES[3];
    }

    if (
        path.startsWith('/communication') ||
        path.startsWith('/emails') ||
        path.startsWith('/admin/communications')
    ) {
        return SALONBW_MODULES[4];
    }

    if (path.startsWith('/services') || path.startsWith('/admin/services')) {
        return SALONBW_MODULES[5];
    }

    if (
        path.startsWith('/settings') ||
        path.startsWith('/admin/settings') ||
        path.startsWith('/admin/timetables') ||
        path.startsWith('/employees') ||
        path.startsWith('/reviews') ||
        path.startsWith('/invoices')
    ) {
        return SALONBW_MODULES[6];
    }

    if (
        path.startsWith('/extension') ||
        path.startsWith('/admin/loyalty') ||
        path.startsWith('/admin/gift-cards')
    ) {
        return SALONBW_MODULES[7];
    }

    if (path.startsWith('/helps')) {
        return HELPS_MODULE;
    }

    return SALONBW_MODULES[0];
}

export function visibleSalonBWModules(
    role: Role | null | undefined,
): SalonBWModule[] {
    if (!role) return [];
    return SALONBW_MODULES.filter((item) => can(role, item.permission));
}
