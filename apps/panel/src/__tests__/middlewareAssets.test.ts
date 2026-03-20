import { isPublicDashboardAssetPath } from '@/middleware';

describe('panel middleware public asset contract', () => {
    it('allows both legacy and salonbw compat asset prefixes', () => {
        expect(isPublicDashboardAssetPath('/versum-calendar/index.html')).toBe(
            true,
        );
        expect(isPublicDashboardAssetPath('/versum-vendor/css/style.css')).toBe(
            true,
        );
        expect(isPublicDashboardAssetPath('/salonbw-calendar/index.html')).toBe(
            true,
        );
        expect(
            isPublicDashboardAssetPath('/salonbw-vendor/css/style.css'),
        ).toBe(true);
    });

    it('keeps compat API endpoints public for vendored runtime', () => {
        expect(isPublicDashboardAssetPath('/events/123/screen_data')).toBe(
            true,
        );
        expect(isPublicDashboardAssetPath('/graphql')).toBe(true);
        expect(
            isPublicDashboardAssetPath(
                '/settings/timetable/schedules/employee/1',
            ),
        ).toBe(true);
        expect(isPublicDashboardAssetPath('/track_new_events.json')).toBe(true);
    });

    it('does not mark app routes as public assets', () => {
        expect(isPublicDashboardAssetPath('/calendar')).toBe(false);
        expect(isPublicDashboardAssetPath('/customers')).toBe(false);
        expect(isPublicDashboardAssetPath('/auth/login')).toBe(false);
    });
});
