import { normalizeCompatStatus } from '@/pages/api/[...path]';

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
