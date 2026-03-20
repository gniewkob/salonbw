import { normalizeCompatStatus } from '@/pages/api/[...path]';

describe('api proxy compat status normalization', () => {
    it('normalizes graphql 201 responses to 200 for vendored runtime', () => {
        expect(normalizeCompatStatus('/graphql', 201)).toBe(200);
    });

    it('does not change non-graphql statuses', () => {
        expect(normalizeCompatStatus('/events', 201)).toBe(201);
        expect(normalizeCompatStatus('/graphql', 200)).toBe(200);
        expect(
            normalizeCompatStatus('/settings/timetable/schedules/1', 200),
        ).toBe(200);
    });
});
