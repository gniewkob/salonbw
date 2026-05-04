import { render, screen } from '@testing-library/react';
import CustomerSummaryTab from '@/components/customers/CustomerSummaryTab';

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
    useCustomerEventHistory: () => ({
        data: { items: [] },
        isLoading: false,
    }),
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
});
