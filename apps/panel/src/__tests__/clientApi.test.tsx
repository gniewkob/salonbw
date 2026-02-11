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
const toast = require('react-hot-toast').toast;

describe('useCustomerApi', () => {
    it('shows success toast on create', async () => {
        const apiFetch = jest.fn().mockResolvedValue({ id: 1, name: 'A' });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useCustomerApi(), { wrapper });
        await act(async () => {
            await result.current.create({ name: 'A' });
        });
        expect(toast.success).toHaveBeenCalled();
    });

    it('shows error toast on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useCustomerApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.create({ name: 'A' });
            }),
        ).rejects.toThrow();
        expect(toast.error).toHaveBeenCalled();
    });
});
