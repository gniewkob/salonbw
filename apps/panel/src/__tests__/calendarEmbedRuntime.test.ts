import {
    buildCalendarEmbedConfig,
    buildCalendarEmbedScript,
    deriveCalendarEmbedIdentity,
    rewriteCalendarEmbedAssetPaths,
    rewriteCalendarEmbedUserIdentity,
} from '@/pages/api/calendar-embed';

describe('calendar embed runtime compat', () => {
    it('publishes SalonBWConfig and preserves VersumConfig alias', () => {
        const script = buildCalendarEmbedScript(buildCalendarEmbedConfig(17));

        expect(script).toContain('window.SalonBWConfig =');
        expect(script).toContain('window.VersumConfig = window.SalonBWConfig;');
        expect(script).toContain('"user_id":17');
    });

    it('rewrites calendar views requests to local runtime endpoints', () => {
        const script = buildCalendarEmbedScript(buildCalendarEmbedConfig(17));

        expect(script).toContain("return '/api/runtime/calendar-views';");
        expect(script).toContain("return '/api/runtime/calendar-views/list';");
        expect(script).toContain("return '/api/runtime/calendar-views/new';");
        expect(script).toContain(
            "return '/api/runtime/calendar-views/' + editMatch[1] + '/edit';",
        );
    });

    it('does not embed any bearer token or authorization logic in the script', () => {
        // Compat URLs (/events, /graphql, /settings/timetable, /track_new_events)
        // are rewritten to /api/* via next.config rewrites and the proxy at
        // /api/[...path].ts injects the bearer from the httpOnly cookie.
        // The embed must not carry the token itself.
        const script = buildCalendarEmbedScript(buildCalendarEmbedConfig(17));

        expect(script).not.toContain('Authorization');
        expect(script).not.toContain('Bearer');
        expect(script).not.toMatch(/const\s+token\s*=/);
    });

    it('rewrites vendored asset paths to salonbw aliases in served html', () => {
        const html = rewriteCalendarEmbedAssetPaths(
            '<link href="/versum-calendar/assets/app.css" />' +
                '<script src="/versum-calendar/runtime.js"></script>' +
                '<link href="/versum-vendor/css/style.css" />',
        );

        expect(html).toContain('/salonbw-calendar/assets/app.css');
        expect(html).toContain('/salonbw-calendar/runtime.js');
        expect(html).toContain('/salonbw-vendor/css/style.css');
        expect(html).not.toContain('/versum-calendar/');
        expect(html).not.toContain('/versum-vendor/');
    });

    it('derives calendar topbar identity from the current profile', () => {
        expect(
            deriveCalendarEmbedIdentity({
                firstName: 'Iwona',
                lastName: 'Adamska',
                role: 'admin',
            }),
        ).toEqual({
            avatarUrl: null,
            fullName: 'Iwona Adamska',
            initials: 'IA',
            profileHref: '/settings/profile',
            roleLabel: 'administrator',
        });
    });

    it('rewrites vendored calendar topbar with current user identity', () => {
        const html = rewriteCalendarEmbedUserIdentity(
            `
                <div class="brand brand-text-sbw"><a href="/dashboard" title="przejdź do pulpitu">Black&amp;White</a></div>
                <ul class="dropdown-menu larger-dropdown-menu nav-help">
                    <li class="divider"></li>
                    <li class="main-menu-li"><a href="/helps/new"><span>Formularz kontaktowy</span></a></li>
                </ul>
                <div class="border-color"><div class="color1">GB</div></div>
                <a class="profil" href="/settings/employees/4272118">
                    <img alt="Data" class="avatar" src="https://cdn.versum.net/avatars/4272118/thumb/data"/>
                    <strong>Gniewko Bodora</strong>
                    administrator
                </a>
                <a class="e2e-user-logout" href="/signout">Wyloguj</a>
            `,
            {
                name: 'Iwona Adamska',
                role: 'admin',
                avatarUrl: 'https://example.com/avatar.png',
            },
        );

        expect(html).toContain('<div class="color1">IA</div>');
        expect(html).toContain('href="/settings/profile"');
        expect(html).toContain('<strong>Iwona Adamska</strong>');
        expect(html).toContain('src="https://example.com/avatar.png"');
        expect(html).toContain(
            '<svg class="svg-logo"><use xlink:href="#svg-logo"></use></svg>',
        );
        expect(html).toContain('href="/dashboard"');
        expect(html).not.toContain('Gniewko Bodora');
        expect(html).not.toContain('/settings/employees/4272118');
    });
});
