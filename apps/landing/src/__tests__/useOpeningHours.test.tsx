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
});
