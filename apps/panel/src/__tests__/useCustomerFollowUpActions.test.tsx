import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCustomerFollowUpActions } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '@/testUtils';

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useCustomerFollowUpActions', () => {
    it('normalizes malformed follow-up actions response', async () => {
        const apiFetch = jest.fn().mockResolvedValue({
            customerId: 'oops',
            items: [
                {
                    id: 10,
                    appointmentId: 'bad-id',
                    action: '',
                    candidateReason: null,
                    occurredAt: null,
                },
                {
                    id: -1,
                    appointmentId: 999,
                    action: 'contacted',
                    candidateReason: 'recent_no_show',
                    occurredAt: '2026-05-16T10:00:00.000Z',
                },
                null,
                {
                    id: 11,
                    appointmentId: 456,
                    action: 'unknown_action_code',
                    candidateReason: 'unknown_reason_code',
                    occurredAt: '2026-05-16T11:00:00.000Z',
                },
            ],
        });

        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

        const { result } = renderHook(() => useCustomerFollowUpActions(123), {
            wrapper,
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual({
            customerId: 123,
            items: [
                {
                    id: 10,
                    appointmentId: 0,
                    action: 'unknown_action',
                    candidateReason: 'unknown_reason',
                    occurredAt: '',
                },
                {
                    id: 11,
                    appointmentId: 456,
                    action: 'unknown_action_code',
                    candidateReason: 'unknown_reason_code',
                    occurredAt: '2026-05-16T11:00:00.000Z',
                },
            ],
        });
        expect(apiFetch).toHaveBeenCalledWith(
            '/crm/customers/123/follow-up-actions?limit=10',
        );
    });

    it('does not fetch follow-up actions for invalid customer ids', () => {
        const apiFetch = jest.fn();
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

        const { result } = renderHook(() => useCustomerFollowUpActions(0), {
            wrapper,
        });

        expect(result.current.fetchStatus).toBe('idle');
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('surfaces invalid follow-up actions payloads as query errors', async () => {
        const apiFetch = jest.fn().mockResolvedValue(null);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

        const { result } = renderHook(() => useCustomerFollowUpActions(123), {
            wrapper,
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toBeUndefined();
        expect(apiFetch).toHaveBeenCalledWith(
            '/crm/customers/123/follow-up-actions?limit=10',
        );
    });
});
