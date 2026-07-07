import { render, screen } from '@testing-library/react';
import CustomerDetailPage from '@/pages/customers/[id]';

jest.mock('next/router', () => ({
    useRouter: () => ({
        isReady: true,
        query: { id: '123' },
        asPath: '/customers/123',
        push: jest.fn(),
    }),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ role: 'admin' }),
}));

jest.mock('@/contexts/SecondaryNavContext', () => ({
    useSetSecondaryNav: () => undefined,
}));

jest.mock('@/components/RouteGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonShell', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/navs/ClientDetailNav', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('@/components/salon/SalonBreadcrumbs', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('@/hooks/useCustomers', () => ({
    useCustomer: () => ({
        data: {
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
            groups: [{ id: 3, name: 'Stali klienci' }],
        },
        isLoading: false,
        error: null,
    }),
    useDeleteCustomer: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
    }),
    useTagsForCustomer: () => ({
        data: [{ id: 7, name: 'VIP' }],
    }),
    useCustomerStatistics: () => ({
        data: {
            completedVisits: 2,
            upcomingVisits: [],
        },
    }),
    useCustomerEventHistory: () => ({
        data: { items: [] },
    }),
}));

jest.mock('@/hooks/useCustomerAlerts', () => ({
    useCustomerAlerts: () => ({
        alerts: [
            {
                id: 'alert-1',
                severity: 'warning',
                label: 'Historia no-show',
            },
        ],
    }),
}));

describe('Customer profile canonical summary', () => {
    it('renders CRM context in /customers/[id] summary tab', () => {
        render(<CustomerDetailPage />);

        expect(screen.getByText('Kontekst CRM')).toBeInTheDocument();
        expect(screen.getByText('Historia no-show')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Timeline' })).toHaveAttribute(
            'href',
            '/customers/123?tab_name=events_history',
        );
    });
});
