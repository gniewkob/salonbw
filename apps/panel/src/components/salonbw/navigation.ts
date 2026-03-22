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
    bodyClasses?: string[];
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
            bodyClasses: [],
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
            bodyClasses: [],
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
            bodyClasses: [],
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
            bodyClasses: [],
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
            bodyId: 'physical_communication',
            bodyClasses: [],
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
            bodyClasses: [],
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
            bodyClasses: [],
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
            bodyId: 'extensions',
            bodyClasses: [],
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
        bodyId: 'physical_helps',
        bodyClasses: ['no_sidenav'],
        mainNavClass: 'settings',
        mainContentClass: 'helps',
        secondaryNavVariant: 'none',
        secondaryNavRootClass: null,
        breadcrumbsIconClass: 'sprite-breadcrumbs_help',
        contentFrameVariant: 'default',
    },
    secondaryNav: false,
};

function withShellOverride(
    module: SalonBWModule,
    shellOverride: Partial<SalonBWShellProfile>,
): SalonBWModule {
    return {
        ...module,
        shell: {
            ...module.shell,
            ...shellOverride,
        },
    };
}

function resolveSettingsShellOverride(path: string) {
    if (path === '/settings') {
        return {
            bodyId: 'settings_dashboard',
            bodyClasses: ['no_sidenav', 'settings-dashboard-landing'],
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/branch')) {
        return {
            bodyId: 'settings_branch',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/calendar')) {
        return {
            bodyId: 'settings_calendar',
            bodyClasses: ['no_sidenav'],
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/categories')) {
        return {
            bodyId: 'settings_categories',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/customer_groups')) {
        return {
            bodyId: 'settings_customer_groups',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (
        path.startsWith('/settings/customer_origins') ||
        path.startsWith('/settings/customer-origins')
    ) {
        return {
            bodyId: 'settings_customer_origins',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/customer-panel')) {
        return {
            bodyId: 'settings_customer_panel',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (
        path.startsWith('/settings/data_protection') ||
        path.startsWith('/settings/data-protection')
    ) {
        return {
            bodyId: 'settings_data_protection',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (
        path.startsWith('/settings/employees') ||
        path.startsWith('/employees')
    ) {
        return {
            bodyId: 'settings_employees',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (
        path.startsWith('/settings/extra_fields') ||
        path.startsWith('/settings/extra-fields')
    ) {
        return {
            bodyId: 'settings_extra_fields',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/payment-configuration')) {
        return {
            bodyId: 'settings_online_payments_config',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/sms')) {
        return {
            bodyId: 'settings_sms',
            mainContentClass: 'communication_settings',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/timetable/branch')) {
        return {
            bodyId: 'timetable_branches',
            bodyClasses: ['no_sidenav'],
            mainContentClass: '',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (
        path.startsWith('/settings/timetable/employees') ||
        path.startsWith('/settings/timetable/employees/')
    ) {
        return {
            bodyId: 'timetable_employees',
            mainContentClass: '',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/timetable/templates')) {
        return {
            bodyId: 'timetable_templates',
            mainContentClass: '',
        } satisfies Partial<SalonBWShellProfile>;
    }

    if (path.startsWith('/settings/trades')) {
        return {
            bodyId: 'settings_trades',
        } satisfies Partial<SalonBWShellProfile>;
    }

    return null;
}

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
        path.startsWith('/newsletters') ||
        path.startsWith('/messages') ||
        path.startsWith('/emails') ||
        path.startsWith('/admin/communications')
    ) {
        if (path.startsWith('/messages')) {
            return withShellOverride(SALONBW_MODULES[4], {
                bodyId: 'communication',
            });
        }
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
        const settingsShellOverride = resolveSettingsShellOverride(path);
        if (settingsShellOverride) {
            return withShellOverride(SALONBW_MODULES[6], settingsShellOverride);
        }

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
