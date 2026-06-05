import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FollowUpStatisticsPage from '@/pages/statistics/follow-up';

const apiFetchMock = jest.fn();
const apiFetchProxy = (...args: unknown[]) => apiFetchMock(...args);

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        role: 'admin',
        isAuthenticated: true,
        initialized: true,
        apiFetch: apiFetchProxy,
    }),
}));

jest.mock('@/components/salon/SalonShell', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonBreadcrumbs', () => ({
    __esModule: true,
    default: () => <div data-testid="breadcrumbs" />,
}));

describe('FollowUpStatisticsPage', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        apiFetchMock.mockResolvedValue({
            from: '2026-05-07',
            to: '2026-05-13',
            actionsTotal: 0,
            byAction: [],
            byReason: [],
            byDay: [],
        });
    });

    it('renders follow-up audit summary from backend endpoint', async () => {
        apiFetchMock.mockResolvedValue({
            from: '2026-05-07',
            to: '2026-05-13',
            actionsTotal: 9,
            byAction: [{ action: 'contacted', count: 4 }],
            byReason: [{ reason: 'recent_no_show', count: 5 }],
            byDay: [{ day: '2026-05-13', count: 2 }],
        });

        render(<FollowUpStatisticsPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('follow-up-audit-page'),
            ).toHaveTextContent('Akcje follow-up łącznie'),
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            '9',
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            'Kontakt wykonany',
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            'Niedawne no-show',
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            '2026-05-13',
        );
        expect(apiFetchMock).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\/crm\/follow-up-actions\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/,
            ),
        );
    });

    it('shows fallback when follow-up audit endpoint fails', async () => {
        apiFetchMock.mockRejectedValue(new Error('unavailable'));

        render(<FollowUpStatisticsPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('follow-up-audit-page'),
            ).toHaveTextContent('Audyt follow-up chwilowo niedostępny.'),
        );
    });

    it('refreshes audit on user demand', async () => {
        let calls = 0;
        apiFetchMock.mockImplementation(() => {
            calls += 1;
            if (calls === 1) {
                return Promise.resolve({
                    from: '2026-05-07',
                    to: '2026-05-13',
                    actionsTotal: 1,
                    byAction: [{ action: 'contacted', count: 1 }],
                    byReason: [{ reason: 'recent_no_show', count: 1 }],
                    byDay: [{ day: '2026-05-13', count: 1 }],
                });
            }
            return Promise.resolve({
                from: '2026-05-07',
                to: '2026-05-13',
                actionsTotal: 2,
                byAction: [{ action: 'deferred', count: 2 }],
                byReason: [{ reason: 'stale_in_progress', count: 2 }],
                byDay: [{ day: '2026-05-13', count: 2 }],
            });
        });

        render(<FollowUpStatisticsPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('follow-up-audit-page'),
            ).toHaveTextContent('1'),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Odśwież' }));
        await waitFor(() =>
            expect(
                screen.getByTestId('follow-up-audit-page'),
            ).toHaveTextContent('2'),
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            'Odroczono',
        );
    });

    it('normalizes malformed payload, deduplicates rows and applies fallback labels', async () => {
        apiFetchMock.mockResolvedValue({
            from: '2026-05-07',
            to: '2026-05-13',
            actionsTotal: 5,
            byAction: [
                { action: 'contacted', count: 3 },
                { action: 'contacted', count: 9 },
                { action: '', count: -2 },
            ],
            byReason: [
                { reason: 'recent_no_show', count: 2 },
                { reason: 'recent_no_show', count: 9 },
                { reason: null, count: 4 },
            ],
            byDay: [
                { day: '2026-05-13', count: 1 },
                { day: '2026-05-13', count: 9 },
                { day: undefined, count: 3 },
            ],
        });

        render(<FollowUpStatisticsPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('follow-up-audit-page'),
            ).toHaveTextContent('Kontakt wykonany (5)'),
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            'Inna akcja (0)',
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            'Niedawne no-show (5)',
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            'Inny powód (4)',
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            '2026-05-13 (5)',
        );
        expect(screen.getByTestId('follow-up-audit-page')).toHaveTextContent(
            '- (3)',
        );
    });

    it('validates date range and blocks fetch for invalid range', async () => {
        render(<FollowUpStatisticsPage />);

        await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByLabelText('Od'), {
            target: { value: '2026-05-20' },
        });
        fireEvent.change(screen.getByLabelText('Do'), {
            target: { value: '2026-05-10' },
        });

        await waitFor(() =>
            expect(
                screen.getByTestId('follow-up-audit-page'),
            ).toHaveTextContent('Data "Od" nie może być późniejsza niż "Do".'),
        );

        const callsAfterInvalidOrder = apiFetchMock.mock.calls.length;

        fireEvent.change(screen.getByLabelText('Do'), {
            target: { value: '2026-06-25' },
        });
        fireEvent.change(screen.getByLabelText('Od'), {
            target: { value: '2026-05-01' },
        });

        await waitFor(() =>
            expect(
                screen.getByTestId('follow-up-audit-page'),
            ).toHaveTextContent('Maksymalny zakres to 31 dni.'),
        );

        expect(apiFetchMock.mock.calls.length).toBe(callsAfterInvalidOrder);
    });
});
