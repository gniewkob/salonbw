import {
    resolvePendingStatusDateWindow,
    isOverduePending,
} from '@/pages/appointments';

describe('resolvePendingStatusDateWindow', () => {
    // Regression guard: the dashboard badge counted 4 online_pending
    // bookings, but "Zarządzaj" showed "Brak wizyt dla wybranych filtrów."
    // because the pending list defaulted to a forward-only window
    // (today..+90d) — a pending booking whose requested time already
    // passed while awaiting confirmation fell outside it.
    it('looks both backward and forward for online_pending', () => {
        const today = new Date('2026-08-03T12:00:00');
        const window = resolvePendingStatusDateWindow('online_pending', today);

        expect(window).toEqual({ from: '2026-05-05', to: '2026-11-01' });
    });

    it('looks both backward and forward for rescheduled_pending', () => {
        const today = new Date('2026-08-03T12:00:00');
        const window = resolvePendingStatusDateWindow(
            'rescheduled_pending',
            today,
        );

        expect(window).toEqual({ from: '2026-05-05', to: '2026-11-01' });
    });

    it('includes a stale pending booking dated before today in the window', () => {
        const today = new Date('2026-08-03T12:00:00');
        const window = resolvePendingStatusDateWindow('online_pending', today)!;

        // The exact appointment from the live bug report: startTime
        // 2026-07-30, still online_pending days later.
        expect('2026-07-30' >= window.from).toBe(true);
        expect('2026-07-30' <= window.to).toBe(true);
    });

    it('does not widen the window for other statuses', () => {
        const today = new Date('2026-08-03T12:00:00');
        expect(resolvePendingStatusDateWindow('confirmed', today)).toBeNull();
        expect(resolvePendingStatusDateWindow('', today)).toBeNull();
    });
});

describe('isOverduePending', () => {
    const today = new Date('2026-08-03T12:00:00');

    // The live bug: appointment #187 stayed online_pending with a startTime
    // (2026-07-30) that had already passed — nobody confirmed/rejected it in
    // time, so it's unclear whether the client showed up, called to cancel,
    // or was simply forgotten. Ola needs a visible flag to go check.
    it('flags an online_pending booking whose time already passed', () => {
        expect(
            isOverduePending(
                {
                    status: 'online_pending',
                    startTime: '2026-07-30T13:30:00.000Z',
                },
                today,
            ),
        ).toBe(true);
    });

    it('flags a rescheduled_pending booking whose time already passed', () => {
        expect(
            isOverduePending(
                {
                    status: 'rescheduled_pending',
                    startTime: '2026-07-30T13:30:00.000Z',
                },
                today,
            ),
        ).toBe(true);
    });

    it('does not flag a pending booking still in the future', () => {
        expect(
            isOverduePending(
                {
                    status: 'online_pending',
                    startTime: '2026-08-10T13:30:00.000Z',
                },
                today,
            ),
        ).toBe(false);
    });

    it('does not flag non-pending statuses even if in the past', () => {
        expect(
            isOverduePending(
                { status: 'confirmed', startTime: '2026-07-30T13:30:00.000Z' },
                today,
            ),
        ).toBe(false);
        expect(
            isOverduePending(
                { status: 'completed', startTime: '2026-07-30T13:30:00.000Z' },
                today,
            ),
        ).toBe(false);
    });
});
