import {
    buildTopbarViewModel,
    deriveTopbarIdentity,
} from '@/lib/topbar/topbarModel';

describe('topbar model', () => {
    it('identifies a technical administrator separately from salon staff', () => {
        const account = { role: 'admin', isSystemAdmin: true };
        expect(deriveTopbarIdentity(account).roleLabel).toBe(
            'administrator systemu',
        );
    });

    it('derives initials and translated role label from user data', () => {
        expect(
            deriveTopbarIdentity({
                firstName: 'Gniewko',
                lastName: 'Bodora',
                role: 'admin',
                avatarUrl: 'https://example.com/avatar.png',
            }),
        ).toEqual({
            avatarUrl: 'https://example.com/avatar.png',
            fullName: 'Gniewko Bodora',
            initials: 'GB',
            profileHref: '/settings/profile',
            roleLabel: 'administrator',
        });
    });

    it('builds a versum-shaped topbar view model without fake counters', () => {
        const topbar = buildTopbarViewModel({
            name: 'Iwona Adamska',
            role: 'employee',
        });

        expect(topbar.brand).toEqual({
            href: '/dashboard',
            mode: 'versum',
        });
        expect(topbar.notifications.unreadCount).toBeNull();
        expect(topbar.tasks.count).toBeNull();
        expect(topbar.user.fullName).toBe('Iwona Adamska');
        expect(topbar.user.roleLabel).toBe('pracownik');
        expect(topbar.menuToggler.enabled).toBe(true);
    });
});
