import { renderHook, waitFor } from '@testing-library/react';
import { useServices } from '@/hooks/useServices';
import { useAppointments } from '@/hooks/useAppointments';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { useList } from '@/hooks/useList';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('list hooks', () => {
    it('useList handles success', async () => {
        const apiFetch = jest.fn().mockResolvedValue([{ id: 1 }]);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const { result } = renderHook(() => useList<{ id: number }>('/x'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.data?.length).toBe(1);
    });

    it('useList handles error', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const { result } = renderHook(() => useList<unknown>('/x'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.loading).toBe(false);
        expect(result.current.error?.message).toBe('fail');
    });

    it('wrappers call useList with proper endpoints', async () => {
        const apiFetch = jest.fn().mockResolvedValue([]);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        renderHook(() => useServices());
        renderHook(() => useAppointments());
        renderHook(() => useProducts());
        renderHook(() => useClients());
        await Promise.resolve();
        expect(apiFetch).toHaveBeenCalledWith('/services');
        expect(apiFetch).toHaveBeenCalledWith('/appointments');
        expect(apiFetch).toHaveBeenCalledWith('/products');
        expect(apiFetch).toHaveBeenCalledWith('/clients');
    });
});

describe('useDashboard', () => {
    it('returns data and upcoming list', async () => {
        const apiFetch = jest.fn().mockResolvedValue({
            clientCount: 1,
            employeeCount: 1,
            todayAppointments: 2,
            upcomingAppointments: [
                { id: 1, startTime: '2025-01-01T00:00:00Z' },
            ],
        });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const { result } = renderHook(() => useDashboard());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.loading).toBe(false);
        expect(result.current.data?.todayAppointments).toBe(2);
        expect(result.current.upcoming.length).toBe(1);
    });
});
