export interface TopbarIdentity {
    avatarUrl: string | null;
    fullName: string;
    initials: string;
    profileHref: string;
    roleLabel: string;
}

export interface TopbarViewModel {
    brand: {
        href: string;
        mode: 'versum';
    };
    search: {
        placeholder: string;
        searchUrl: string;
    };
    notifications: {
        enabled: boolean;
        unreadCount: number | null;
    };
    tasks: {
        enabled: boolean;
        count: number | null;
    };
    help: {
        contactFormHref: string;
        showChat: boolean;
        knowledgeBaseHref: string | null;
    };
    user: TopbarIdentity & {
        logoutHref?: string;
    };
    menuToggler: {
        enabled: boolean;
    };
}

type TopbarUserLike = {
    name?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    avatarUrl?: string;
    profileHref?: string;
};

function normalizeRoleLabel(role?: string | null) {
    switch (role) {
        case 'admin':
            return 'administrator';
        case 'employee':
            return 'pracownik';
        case 'receptionist':
            return 'recepcjonista';
        case 'client':
            return 'klient';
        default:
            return role?.trim() || 'administrator';
    }
}

export function deriveTopbarIdentity(
    user?: TopbarUserLike | null,
): TopbarIdentity {
    const fullName =
        user?.name?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        'Użytkownik';
    const [first = '', second = ''] = fullName.split(/\s+/, 2);
    const initials =
        `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || 'SB';

    return {
        avatarUrl: user?.avatarUrl?.trim() || null,
        fullName,
        initials,
        profileHref: user?.profileHref || '/settings/profile',
        roleLabel: normalizeRoleLabel(user?.role),
    };
}

export function buildTopbarViewModel(
    user?: TopbarUserLike | null,
): TopbarViewModel {
    return {
        brand: {
            href: '/dashboard',
            mode: 'versum',
        },
        search: {
            placeholder: 'Szukaj...',
            searchUrl: '/global_searches',
        },
        notifications: {
            enabled: true,
            unreadCount: null,
        },
        tasks: {
            enabled: true,
            count: null,
        },
        help: {
            contactFormHref: '/helps/new',
            showChat: false,
            knowledgeBaseHref: null,
        },
        user: {
            ...deriveTopbarIdentity(user),
            logoutHref: '/signout',
        },
        menuToggler: {
            enabled: true,
        },
    };
}
