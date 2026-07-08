import { render, screen } from '@testing-library/react';
import CustomerSummaryTab from '@/components/customers/CustomerSummaryTab';

const mockUseCustomerEventHistory = jest.fn();

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerStatistics: () => ({
        data: {
            completedVisits: 2,
            totalSpent: 300,
            averageSpent: 150,
            lastVisitDate: '2026-05-01T10:00:00.000Z',
            favoriteServices: [],
            favoriteEmployees: [],
        },
        isLoading: false,
    }),
    useCustomerEventHistory: (...args: unknown[]) =>
        mockUseCustomerEventHistory(...args),
    useCustomerGroups: () => ({ data: [] }),
    useTagsForCustomer: () => ({
        data: [{ id: 7, name: 'VIP', createdAt: '2026-05-01T00:00:00.000Z' }],
    }),
    useAddGroupMembers: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
    }),
    useRemoveGroupMember: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
    }),
}));

jest.mock('@/hooks/useCustomerLinkedSales', () => ({
    useCustomerLinkedSales: () => ({
        linkedSalesQuery: {
            data: { items: [], total: 0 },
            isLoading: false,
        },
    }),
}));

jest.mock('@/hooks/useCustomerAlerts', () => ({
    useCustomerAlerts: () => ({
        alerts: [
            {
                id: 'alert-1',
                severity: 'warning',
                label: 'Historia no-show',
                detail: 'Liczba nieobecności: 1',
            },
        ],
    }),
}));

describe('CustomerSummaryTab', () => {
    beforeEach(() => {
        mockUseCustomerEventHistory.mockReturnValue({
            data: { items: [] },
            isLoading: false,
        });
    });

    it('renders CRM context with alerts, tags, groups and timeline shortcut', () => {
        render(
            <CustomerSummaryTab
                customer={{
                    id: 123,
                    name: 'Jan Kowalski',
                    fullName: 'Jan Kowalski',
                    email: 'jan@example.com',
                    phone: '111222333',
                    smsConsent: true,
                    emailConsent: true,
                    gdprConsent: true,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                    groups: [
                        {
                            id: 3,
                            name: 'Stali klienci',
                            createdAt: '2026-01-01T00:00:00.000Z',
                        },
                    ],
                }}
            />,
        );

        expect(screen.getByText('Kontekst CRM')).toBeInTheDocument();
        expect(screen.getByText('Historia no-show')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getAllByText('Stali klienci').length).toBeGreaterThan(0);
        expect(
            screen.getByRole('link', { name: 'Przejdź do timeline' }),
        ).toHaveAttribute('href', '/customers/123?tab_name=events_history');
    });

    it('renders structured notes in recent visits summary', () => {
        mockUseCustomerEventHistory.mockReturnValue({
            isLoading: false,
            data: {
                items: [
                    {
                        id: 77,
                        date: '2026-05-01',
                        time: '10:00',
                        service: { id: 4, name: 'Dermabrazja' },
                        employee: { id: 2, name: 'Aleksandra' },
                        status: 'completed',
                        price: 150,
                        notes: null,
                        clientComment: 'klient chce ciszę',
                        staffRecommendations: 'MYĆ I NIE PŁUKAĆ',
                        onlineAddonsSummary: 'Pielęgnacja (+30 min)',
                        onlineTotalDurationMinutes: 100,
                        onlineDurationNeedsVerification: true,
                    },
                ],
            },
        });

        render(
            <CustomerSummaryTab
                customer={{
                    id: 123,
                    name: 'Jan Kowalski',
                    fullName: 'Jan Kowalski',
                    email: 'jan@example.com',
                    phone: '111222333',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                }}
            />,
        );

        expect(screen.getByText('Dermabrazja')).toBeInTheDocument();
        expect(screen.getByText('Komentarz do rezerwacji')).toBeInTheDocument();
        expect(screen.getByText('Zalecenia po wizycie')).toBeInTheDocument();
        expect(screen.getByText('Dodatkowe zabiegi')).toBeInTheDocument();
        expect(
            screen.queryByText('Salon potwierdzi łączny czas wizyty.'),
        ).not.toBeInTheDocument();
    });
});
