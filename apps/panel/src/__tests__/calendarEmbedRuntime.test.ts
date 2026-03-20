import {
    buildCalendarEmbedConfig,
    buildCalendarEmbedScript,
    rewriteCalendarEmbedAssetPaths,
} from '@/pages/api/calendar-embed';

describe('calendar embed runtime compat', () => {
    it('publishes SalonBWConfig and preserves VersumConfig alias', () => {
        const script = buildCalendarEmbedScript(
            buildCalendarEmbedConfig(17),
            'token-123',
        );

        expect(script).toContain('window.SalonBWConfig =');
        expect(script).toContain('window.VersumConfig = window.SalonBWConfig;');
        expect(script).toContain('"user_id":17');
    });

    it('rewrites calendar views requests to local runtime endpoints', () => {
        const script = buildCalendarEmbedScript(
            buildCalendarEmbedConfig(17),
            'token-123',
        );

        expect(script).toContain("return '/api/runtime/calendar-views';");
        expect(script).toContain("return '/api/runtime/calendar-views/list';");
        expect(script).toContain("return '/api/runtime/calendar-views/new';");
        expect(script).toContain(
            "return '/api/runtime/calendar-views/' + editMatch[1] + '/edit';",
        );
    });

    it('adds authorization to compat API traffic only', () => {
        const script = buildCalendarEmbedScript(
            buildCalendarEmbedConfig(17),
            'token-123',
        );

        expect(script).toContain("rewrittenUrl.includes('/events')");
        expect(script).toContain("rewrittenUrl.includes('/graphql')");
        expect(script).toContain(
            "rewrittenUrl.includes('/settings/timetable')",
        );
        expect(script).toContain("rewrittenUrl.includes('/track_new_events')");
        expect(script).toContain("Authorization', 'Bearer ' + token");
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
});
