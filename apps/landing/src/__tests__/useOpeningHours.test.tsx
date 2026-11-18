import { renderHook, waitFor } from '@testing-library/react';
import { useOpeningHours } from '@/hooks/useOpeningHours';

describe('public opening hours', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockReset();
    });

    it('keeps an explicitly closed week closed instead of advertising fallback hours', async () => {
        const hours = Object.fromEntries(
            ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => [
                day,
                [],
            ]),
        );
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ source: 'timetables', hours }),
        });

        const { result } = renderHook(() => useOpeningHours());

        await waitFor(() => {
            expect(result.current.lines).toEqual([
                { label: 'Pn–Nd', value: 'Zamknięte', closed: true },
            ]);
        });
    });

    it('exposes the live schedule so today-status and the hours list agree', async () => {
        const initial = Object.fromEntries(
            ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => [
                day,
                [{ open: '09:00', close: '17:00' }],
            ]),
        );
        const live = { ...initial, tue: [{ open: '12:00', close: '20:00' }] };
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ source: 'timetables', hours: live }),
        });

        const { result } = renderHook(() => useOpeningHours(initial));

        // Before the fetch resolves, the server schedule is used.
        expect(result.current.hours).toBe(initial);
        await waitFor(() => {
            expect(result.current.hours).toEqual(live);
        });
        expect(result.current.lines).toContainEqual({
            label: 'Wt',
            value: '12:00 - 20:00',
            closed: false,
        });
    });
});
