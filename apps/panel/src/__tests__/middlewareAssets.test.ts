import { isPublicDashboardAssetPath } from '@/middleware';

describe('panel middleware public asset contract', () => {
    it('marks framework + static asset prefixes as public', () => {
        expect(isPublicDashboardAssetPath('/_next/static/chunks/main.js')).toBe(
            true,
        );
        expect(isPublicDashboardAssetPath('/assets/img/logo.png')).toBe(true);
        expect(isPublicDashboardAssetPath('/favicon.ico')).toBe(true);
        expect(isPublicDashboardAssetPath('/icon.svg')).toBe(true);
        expect(isPublicDashboardAssetPath('/api/calendar-views')).toBe(true);
    });

    it('does not mark app routes as public assets', () => {
        expect(isPublicDashboardAssetPath('/calendar')).toBe(false);
        expect(isPublicDashboardAssetPath('/customers')).toBe(false);
        expect(isPublicDashboardAssetPath('/auth/login')).toBe(false);
    });

    it('no longer treats removed vendored Versum embed paths as public', () => {
        // These were public while /api/calendar-embed served the vendored
        // Versum runtime. The embed was deleted; treat the URLs like any
        // other unauthenticated request.
        expect(isPublicDashboardAssetPath('/versum-calendar/index.html')).toBe(
            false,
        );
        expect(isPublicDashboardAssetPath('/salonbw-calendar/index.html')).toBe(
            false,
        );
        expect(isPublicDashboardAssetPath('/events/123/screen_data')).toBe(
            false,
        );
        expect(isPublicDashboardAssetPath('/graphql')).toBe(false);
        expect(isPublicDashboardAssetPath('/track_new_events.json')).toBe(
            false,
        );
    });
});
