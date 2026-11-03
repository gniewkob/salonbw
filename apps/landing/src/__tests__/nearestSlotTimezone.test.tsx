import { render, screen } from '@testing-library/react';
import NearestSlotTeaser from '@/components/NearestSlotTeaser';

it('shows appointment times in the salon time zone, also for visitors abroad', async () => {
    const slot = '2026-10-26T08:00:00.000Z';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ slot }),
    });
    render(<NearestSlotTeaser />);
    const salonTime = new Intl.DateTimeFormat('pl-PL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Warsaw',
    }).format(new Date(slot));

    expect(await screen.findByText(salonTime)).toBeInTheDocument();
});
