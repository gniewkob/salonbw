import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useCustomerApi } from '@/api/customers';
import { useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('react-hot-toast', () => ({
    Toaster: () => null,
    toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useCustomerApi extra', () => {
    it('updates and removes client without throwing', async () => {
        const apiFetch = jest
            .fn()
            .mockResolvedValueOnce({ id: 1, name: 'X' }) // update
            .mockResolvedValueOnce(undefined); // remove
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useCustomerApi(), { wrapper });
        await act(async () => {
            await result.current.update(1, { name: 'X' });
        });
        await act(async () => {
            await result.current.remove(1);
        });
        expect(apiFetch).toHaveBeenCalledTimes(2);
    });
});
