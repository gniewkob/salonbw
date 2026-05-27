import { buildTargetUrl, normalizeCompatStatus } from '@/pages/api/[...path]';

describe('api proxy compat status normalization', () => {
    // normalizeCompatStatus used to remap POST /graphql 201 → 200 for the
    // vendored Versum calendar embed. The embed was removed; the function
    // is now a passthrough kept only for caller stability.

    it('is a passthrough for all statuses', () => {
        expect(normalizeCompatStatus('/graphql', 201)).toBe(201);
        expect(normalizeCompatStatus('/graphql', 200)).toBe(200);
        expect(normalizeCompatStatus('/events', 201)).toBe(201);
        expect(
            normalizeCompatStatus('/settings/timetable/schedules/1', 200),
        ).toBe(200);
    });
});

describe('api proxy target url builder', () => {
    it('forwards query params to backend url', () => {
        const target = buildTargetUrl(
            'https://api.salon-bw.pl',
            ['calendar', 'events'],
            {
                path: ['calendar', 'events'],
                date: '2026-05-27',
                view: 'day',
                employeeIds: '1,2',
            },
        );

        expect(target).toBe(
            'https://api.salon-bw.pl/calendar/events?date=2026-05-27&view=day&employeeIds=1%2C2',
        );
    });

    it('supports repeated query values', () => {
        const target = buildTargetUrl(
            'https://api.salon-bw.pl',
            ['calendar', 'events'],
            {
                path: ['calendar', 'events'],
                employeeIds: ['1', '2'],
            },
        );

        expect(target).toBe(
            'https://api.salon-bw.pl/calendar/events?employeeIds=1&employeeIds=2',
        );
    });
});
