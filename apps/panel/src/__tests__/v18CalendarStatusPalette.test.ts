import { getEventStatusVisual } from '@/components/calendar/EventCard';

describe('Studio V18 appointment palette', () => {
    it('uses a muted purple accent for pending visits without changing classic calendar colors', () => {
        expect(getEventStatusVisual('online_pending', 'v18')).toEqual({
            strip: '#79549b',
            stripText: '#ffffff',
            body: '#f4edfa',
        });
        expect(getEventStatusVisual('online_pending').strip).toBe('#b45309');
    });

    it('distinguishes confirmed, scheduled, ongoing and cancelled visits', () => {
        const statuses = [
            'scheduled',
            'confirmed',
            'in_progress',
            'cancelled',
        ] as const;
        expect(
            new Set(statuses.map((status) => getEventStatusVisual(status, 'v18').strip)).size,
        ).toBe(statuses.length);
        for (const status of statuses) {
            const visual = getEventStatusVisual(status, 'v18');
            expect(visual.body).toMatch(/^#[0-9a-f]{6}$/);
            expect(visual.strip).toMatch(/^#[0-9a-f]{6}$/);
        }
    });

    it('fails to a neutral scheduled palette for an unknown status', () => {
        expect(getEventStatusVisual('unexpected', 'v18')).toEqual(
            getEventStatusVisual('scheduled', 'v18'),
        );
    });
});
