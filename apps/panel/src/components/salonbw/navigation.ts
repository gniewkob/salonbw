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

export interface SalonBWShellProfile {
    bodyId: string;
    mainNavClass: string;
    mainContentClass: string;
    secondaryNavVariant:
        | 'calendar'
        | 'customers'
        | 'products'
        | 'tree'
        | 'list'
        | 'none';
    secondaryNavRootClass: string | null;
    breadcrumbsIconClass: string | null;
    contentFrameVariant: 'default' | 'calendar' | 'fullWidth';
}

export interface SalonBWModule {
    key: SalonBWModuleKey;
    href: string;
    label: string;
    iconId: string;
    permission: Permission;
    shell: SalonBWShellProfile;
    secondaryNav: boolean;
    pinBottom?: boolean;
}

export const SALONBW_MODULES: SalonBWModule[] = [
    {
        key: 'calendar',
        href: '/calendar',
        label: 'kalendarz',
        iconId: 'svg-calendar-nav',
        permission: 'nav:calendar',
        shell: {
            bodyId: 'calendar',
            mainNavClass: 'calendar',
            mainContentClass: 'calendar',
            secondaryNavVariant: 'calendar',
            secondaryNavRootClass: 'hasDatepicker',
            breadcrumbsIconClass: null,
            contentFrameVariant: 'calendar',
        },
        secondaryNav: true,
    },
    {
        key: 'customers',
        href: '/customers',
        label: 'klienci',
        iconId: 'svg-customers-nav',
        permission: 'nav:customers',
        shell: {
            bodyId: 'customers',
            mainNavClass: 'customers',
            mainContentClass: 'customers',
            secondaryNavVariant: 'customers',
            secondaryNavRootClass: 'customers_index',
            breadcrumbsIconClass: 'sprite-breadcrumbs_customers',
            contentFrameVariant: 'fullWidth',
        },
        secondaryNav: true, // Page has its own sidebar with dynamic content
    },
    {
        key: 'products',
        href: '/products',
        label: 'magazyn',
        iconId: 'svg-stock-nav',
        permission: 'nav:products',
        shell: {
            bodyId: 'physical_products',
            mainNavClass: 'stock',
            mainContentClass: 'stock',
            secondaryNavVariant: 'products',
            secondaryNavRootClass: 'column_row',
            breadcrumbsIconClass: 'sprite-breadcrumbs_stock',
            contentFrameVariant: 'default',
        },
        secondaryNav: true,
    },
    {
        key: 'statistics',
        href: '/statistics',
        label: 'statystyki',
        iconId: 'svg-statistics-nav',
        permission: 'nav:statistics',
        shell: {
            bodyId: 'logical_statistics',
            mainNavClass: 'statistics',
            mainContentClass: 'statistics',
            secondaryNavVariant: 'tree',
            secondaryNavRootClass: 'column_row tree',
            breadcrumbsIconClass: 'sprite-breadcrumbs_statistics',
            contentFrameVariant: 'fullWidth',
        },
        secondaryNav: true,
    },
    {
        key: 'communication',
        href: '/communication',
        label: 'łączność',
        iconId: 'svg-communication-nav',
        permission: 'nav:communication',
        shell: {
            bodyId: 'communication',
            mainNavClass: 'communication',
            mainContentClass: 'communication',
            secondaryNavVariant: 'list',
            secondaryNavRootClass: 'column_row',
            breadcrumbsIconClass: 'sprite-breadcrumbs_communication',
            contentFrameVariant: 'default',
        },
        secondaryNav: true,
    },
    {
        key: 'services',
        href: '/services',
        label: 'usługi',
        iconId: 'svg-services-nav',
        permission: 'nav:services',
        shell: {
            bodyId: 'services',
            mainNavClass: 'services',
            mainContentClass: 'services',
            secondaryNavVariant: 'list',
            secondaryNavRootClass: 'column_row',
            breadcrumbsIconClass: 'sprite-breadcrumbs_services',
            contentFrameVariant: 'default',
        },
        secondaryNav: true,
    },
    {
        key: 'settings',
        href: '/settings',
        label: 'ustawienia',
        iconId: 'svg-settings-nav',
        permission: 'nav:settings',
        shell: {
            bodyId: 'settings',
            mainNavClass: 'settings',
            mainContentClass: 'settings',
            secondaryNavVariant: 'list',
            secondaryNavRootClass: 'column_row',
            breadcrumbsIconClass: 'sprite-breadcrumbs_settings',
            contentFrameVariant: 'default',
        },
        secondaryNav: true,
    },
    {
        key: 'extension',
        href: '/extension',
        label: 'dodatki',
        iconId: 'svg-extensions-nav',
        permission: 'nav:extension',
        shell: {
            bodyId: 'extension',
            mainNavClass: 'extensions',
            mainContentClass: 'extensions',
            secondaryNavVariant: 'list',
            secondaryNavRootClass: 'column_row',
            breadcrumbsIconClass: 'sprite-breadcrumbs_extensions',
            contentFrameVariant: 'default',
        },
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
    shell: {
        bodyId: 'helps',
        mainNavClass: 'settings',
        mainContentClass: 'helps',
        secondaryNavVariant: 'none',
        secondaryNavRootClass: null,
        breadcrumbsIconClass: 'sprite-breadcrumbs_help',
        contentFrameVariant: 'default',
    },
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
