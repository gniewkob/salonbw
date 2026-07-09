import { render, screen } from '@testing-library/react';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';

const mockUseCustomerEventHistory = jest.fn();
const mockUseCustomerFollowUpActions = jest.fn();

jest.mock('@/components/customers/CustomerTimeline', () => ({
    __esModule: true,
    default: () => <div data-testid="customer-timeline-mock">timeline</div>,
}));

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerEventHistory: (...args: unknown[]) =>
        mockUseCustomerEventHistory(...args),
    useCustomerFollowUpActions: (...args: unknown[]) =>
        mockUseCustomerFollowUpActions(...args),
}));

jest.mock('@/hooks/useCustomerLinkedSales', () => ({
    useCustomerLinkedSales: () => ({
        linkedSalesQuery: {
            data: { items: [], total: 0 },
            isLoading: false,
            isError: false,
        },
    }),
}));

describe('CustomerHistoryTab', () => {
    beforeEach(() => {
        mockUseCustomerEventHistory.mockReturnValue({
            isLoading: false,
            error: null,
            data: {
                items: [],
                counts: {
                    all: 0,
                    upcoming: 0,
                    completed: 0,
                    cancelled: 0,
                    no_show: 0,
                },
                total: 0,
                limit: 20,
                offset: 0,
            },
        });
        mockUseCustomerFollowUpActions.mockReturnValue({
            isLoading: false,
            isError: false,
            data: { customerId: 123, items: [] },
        });
    });

    it('renders timeline context and detailed sections labels', () => {
        render(<CustomerHistoryTab customerId={123} />);

        expect(screen.getByText('Timeline klienta')).toBeInTheDocument();
        expect(
            screen.getByText(/Szybki kontekst \(wizyty, sprzedaże, notatki\)/i),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('customer-timeline-mock'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/szczegóły sprzedaży klienta/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/ostatnie działania follow-up/i),
        ).toBeInTheDocument();
        expect(screen.getByText('Brak działań follow-up.')).toBeInTheDocument();
        expect(
            screen.getByText(/szczegóły historii wizyt/i),
        ).toBeInTheDocument();
    });

    it('renders follow-up error as non-blocking section fallback', () => {
        mockUseCustomerFollowUpActions.mockReturnValue({
            isLoading: false,
            isError: true,
            data: null,
        });

        render(<CustomerHistoryTab customerId={123} />);

        expect(
            screen.getByText('Nie udało się załadować działań follow-up.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/szczegóły historii wizyt/i),
        ).toBeInTheDocument();
    });

    it('renders empty follow-up state for malformed payload items', () => {
        mockUseCustomerFollowUpActions.mockReturnValue({
            isLoading: false,
            isError: false,
            data: { customerId: 123, items: null },
        });

        render(<CustomerHistoryTab customerId={123} />);

        expect(screen.getByText('Brak działań follow-up.')).toBeInTheDocument();
        expect(
            screen.getByText(/szczegóły historii wizyt/i),
        ).toBeInTheDocument();
    });

    it('renders fallback labels for unknown action and reason', () => {
        mockUseCustomerFollowUpActions.mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                customerId: 123,
                items: [
                    {
                        id: 1,
                        appointmentId: 456,
                        candidateReason: 'unknown_reason_code',
                        action: 'unknown_action_code',
                        occurredAt: '2026-05-16T10:00:00.000Z',
                    },
                ],
            },
        });

        render(<CustomerHistoryTab customerId={123} />);

        expect(screen.getByText('Nieznana akcja')).toBeInTheDocument();
        expect(screen.getByText('Nieznany powód')).toBeInTheDocument();
    });

    it('renders separated visit notes in CRM history rows', () => {
        mockUseCustomerEventHistory.mockReturnValue({
            isLoading: false,
            error: null,
            data: {
                items: [
                    {
                        id: 10,
                        date: '2026-05-01',
                        time: '10:00',
                        service: { id: 7, name: 'Koloryzacja' },
                        employee: { id: 2, name: 'Aleksandra' },
                        status: 'completed',
                        price: 150,
                        clientComment: 'klient chce ciszę',
                        staffRecommendations: 'MYĆ I NIE PŁUKAĆ',
                        onlineAddonsSummary: 'Dermabrazja (+70 min)',
                        onlineTotalDurationMinutes: 150,
                        onlineDurationNeedsVerification: true,
                    },
                ],
                counts: {
                    all: 1,
                    upcoming: 0,
                    completed: 1,
                    cancelled: 0,
                    no_show: 0,
                },
                total: 1,
                limit: 20,
                offset: 0,
            },
        });

        render(<CustomerHistoryTab customerId={123} />);

        expect(screen.getByText('Koloryzacja')).toBeInTheDocument();
        expect(screen.getByText('Komentarz do rezerwacji')).toBeInTheDocument();
        expect(screen.getByText('Zalecenia po wizycie')).toBeInTheDocument();
        expect(screen.getByText('Dodatkowe zabiegi')).toBeInTheDocument();
        expect(
            screen.queryByText('Salon potwierdzi łączny czas wizyty.'),
        ).not.toBeInTheDocument();
    });
});
