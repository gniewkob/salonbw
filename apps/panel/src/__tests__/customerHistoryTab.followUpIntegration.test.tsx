import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '@/testUtils';

const mockUseCustomerEventHistory = jest.fn();

jest.mock('@/contexts/AuthContext');
jest.mock('@/components/customers/CustomerTimeline', () => ({
    __esModule: true,
    default: () => <div data-testid="customer-timeline-mock">timeline</div>,
}));

jest.mock('@/hooks/useCustomers', () => {
    const actual = jest.requireActual('@/hooks/useCustomers');
    return {
        ...actual,
        useCustomerEventHistory: (...args: unknown[]) =>
            mockUseCustomerEventHistory(...args),
    };
});

jest.mock('@/hooks/useCustomerLinkedSales', () => ({
    useCustomerLinkedSales: () => ({
        linkedSalesQuery: {
            data: { items: [], total: 0 },
            isLoading: false,
            isError: false,
        },
    }),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('CustomerHistoryTab follow-up integration', () => {
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
    });

    it('renders fallback labels for unknown action/reason from malformed API payload', async () => {
        const apiFetch = jest.fn(async (endpoint: string) => {
            if (endpoint.startsWith('/crm/customers/123/follow-up-actions')) {
                return {
                    customerId: 'broken',
                    items: [
                        {
                            id: 1,
                            appointmentId: 789,
                            action: 'legacy_unknown_action',
                            candidateReason: 'legacy_unknown_reason',
                            occurredAt: '2026-05-16T10:00:00.000Z',
                        },
                        {
                            id: 2,
                            appointmentId: -1,
                            action: '',
                            candidateReason: null,
                            occurredAt: null,
                        },
                        { id: -3, appointmentId: 1 },
                    ],
                };
            }
            return {
                items: [],
                total: 0,
                limit: 20,
                offset: 0,
                counts: {
                    all: 0,
                    upcoming: 0,
                    completed: 0,
                    cancelled: 0,
                    no_show: 0,
                },
            };
        });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

        render(<CustomerHistoryTab customerId={123} />, { wrapper });

        await waitFor(() => {
            expect(screen.getAllByText('Nieznana akcja')).toHaveLength(2);
            expect(screen.getAllByText('Nieznany powód')).toHaveLength(2);
        });

        expect(screen.getByText('#789')).toBeInTheDocument();
        expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
        expect(apiFetch).toHaveBeenCalledWith(
            '/crm/customers/123/follow-up-actions?limit=10',
        );
    });
});
