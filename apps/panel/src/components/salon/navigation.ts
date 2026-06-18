import type { Role } from '@/types';
import { can, type Permission } from '@/utils/access';

export type SalonModuleKey =
    | 'calendar'
    | 'customers'
    | 'products'
    | 'statistics'
    | 'communication'
    | 'services'
    | 'settings'
    | 'helps'
    | 'booking'
    | 'clientHome';

export interface SalonShellProfile {
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

export interface SalonModule {
    key: SalonModuleKey;
    href: string;
    label: string;
    iconId: string;
    permission: Permission;
    shell: SalonShellProfile;
    secondaryNav: boolean;
    pinBottom?: boolean;
}

export const SALON_MODULES: SalonModule[] = [
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
];

// Client-facing booking wizard: no staff sidebar (mini-calendar / PRACOWNICY
// list are meaningless for a client picking a service), full-width content.
const BOOKING_MODULE: SalonModule = {
    key: 'booking',
    href: '/booking',
    label: 'rezerwacja',
    iconId: 'svg-calendar-nav',
    permission: 'nav:appointments',
    shell: {
        bodyId: 'physical_booking',
        bodyClasses: ['no_sidenav'],
        mainNavClass: 'calendar',
        mainContentClass: 'booking',
        secondaryNavVariant: 'none',
        secondaryNavRootClass: null,
        breadcrumbsIconClass: 'sprite-breadcrumbs_calendar',
        contentFrameVariant: 'default',
    },
    secondaryNav: false,
};

// Clients are not staff: they get a minimal, full-width panel (no module
// sidebar) with just their own data. Both client rail entries gate on the
// client-exclusive `dashboard:client` permission so they never show for staff.
const CLIENT_SHELL: SalonShellProfile = {
    bodyId: 'client_panel',
    bodyClasses: ['no_sidenav'],
    mainNavClass: 'client',
    mainContentClass: 'client',
    secondaryNavVariant: 'none',
    secondaryNavRootClass: null,
    breadcrumbsIconClass: null,
    contentFrameVariant: 'default',
};

const CLIENT_MODULES: SalonModule[] = [
    {
        key: 'clientHome',
        href: '/dashboard',
        label: 'moje wizyty',
        iconId: 'svg-calendar-nav',
        permission: 'dashboard:client',
        shell: CLIENT_SHELL,
        secondaryNav: false,
    },
    {
        key: 'booking',
        href: '/booking',
        label: 'rezerwacja',
        iconId: 'svg-services-nav',
        permission: 'dashboard:client',
        shell: CLIENT_SHELL,
        secondaryNav: false,
    },
];

const HELPS_MODULE: SalonModule = {
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
    module: SalonModule,
    shellOverride: Partial<SalonShellProfile>,
): SalonModule {
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
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/branch')) {
        return {
            bodyId: 'settings_branch',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/calendar')) {
        return {
            bodyId: 'settings_calendar',
            bodyClasses: ['no_sidenav'],
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/categories')) {
        return {
            bodyId: 'settings_categories',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/customers')) {
        return {
            bodyId: 'settings_customers',
        } satisfies Partial<SalonShellProfile>;
    }

    if (
        path.startsWith('/settings/customer-groups') ||
        path.startsWith('/settings/customer_groups')
    ) {
        return {
            bodyId: 'settings_customer_groups',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/customer-origins')) {
        return {
            bodyId: 'settings_customer_origins',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/customer-panel')) {
        return {
            bodyId: 'settings_customer_panel',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/online-booking')) {
        return {
            bodyId: 'settings_online_booking',
        } satisfies Partial<SalonShellProfile>;
    }

    if (
        path.startsWith('/settings/data_protection') ||
        path.startsWith('/settings/data-protection')
    ) {
        return {
            bodyId: 'settings_data_protection',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/privacy')) {
        return {
            bodyId: 'settings_privacy',
        } satisfies Partial<SalonShellProfile>;
    }

    if (
        path.startsWith('/settings/employees') ||
        path.startsWith('/employees')
    ) {
        return {
            bodyId: 'settings_employees',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/extra-fields')) {
        return {
            bodyId: 'settings_extra_fields',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/payment-configuration')) {
        return {
            bodyId: 'settings_online_payments_config',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/sms')) {
        return {
            bodyId: 'settings_sms',
            mainContentClass: 'communication_settings',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/timetable/branch')) {
        return {
            bodyId: 'timetable_branches',
            bodyClasses: ['no_sidenav'],
            mainContentClass: '',
        } satisfies Partial<SalonShellProfile>;
    }

    if (
        path.startsWith('/settings/timetable/employees') ||
        path.startsWith('/settings/timetable/employees/')
    ) {
        return {
            bodyId: 'timetable_employees',
            mainContentClass: '',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/timetable/templates')) {
        return {
            bodyId: 'timetable_templates',
            mainContentClass: '',
        } satisfies Partial<SalonShellProfile>;
    }

    if (path.startsWith('/settings/trades')) {
        return {
            bodyId: 'settings_trades',
        } satisfies Partial<SalonShellProfile>;
    }

    return null;
}

export function resolveSalonModule(
    pathname: string,
    role?: Role | null,
): SalonModule {
    // Normalize path
    const path = pathname.toLowerCase();

    // Clients never get a staff module shell (calendar mini + PRACOWNICY
    // sidebar leaked onto /dashboard and /account). Resolve everything they
    // can reach to the clean full-width client shell.
    if (role === 'client') {
        if (path.startsWith('/booking')) {
            return CLIENT_MODULES[1];
        }
        return CLIENT_MODULES[0];
    }

    if (
        path.startsWith('/calendar') ||
        path.startsWith('/appointments') ||
        path.startsWith('/dashboard') ||
        path === '/'
    ) {
        return SALON_MODULES[0];
    }

    if (path.startsWith('/customers')) {
        return SALON_MODULES[1];
    }

    // Program lojalnościowy: a customer-relationship tool, so it lives under
    // the Klienci module (nav icon stays active) but renders full-width — the
    // customer-list filter sidebar (groups/criteria) is meaningless here.
    if (path.startsWith('/loyalty')) {
        return withShellOverride(SALON_MODULES[1], {
            secondaryNavVariant: 'none',
            secondaryNavRootClass: null,
            bodyClasses: ['no_sidenav'],
        });
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
        path.startsWith('/manufacturers')
    ) {
        return SALON_MODULES[2];
    }

    if (path.startsWith('/statistics')) {
        return SALON_MODULES[3];
    }

    if (
        path.startsWith('/communication') ||
        path.startsWith('/newsletters') ||
        path.startsWith('/messages') ||
        path.startsWith('/emails') ||
        path.startsWith('/notifications') ||
        path.startsWith('/admin/communications')
    ) {
        return SALON_MODULES[4];
    }

    if (path.startsWith('/services')) {
        return SALON_MODULES[5];
    }

    if (path.startsWith('/settings') || path.startsWith('/reviews')) {
        const settingsShellOverride = resolveSettingsShellOverride(path);
        if (settingsShellOverride) {
            return withShellOverride(SALON_MODULES[6], settingsShellOverride);
        }

        return SALON_MODULES[6];
    }

    if (path.startsWith('/booking')) {
        return BOOKING_MODULE;
    }

    if (path.startsWith('/helps')) {
        return HELPS_MODULE;
    }

    return SALON_MODULES[0];
}

export function visibleSalonModules(
    role: Role | null | undefined,
): SalonModule[] {
    if (!role) return [];
    if (role === 'client') {
        return CLIENT_MODULES.filter((item) => can(role, item.permission));
    }
    return SALON_MODULES.filter((item) => can(role, item.permission));
}
