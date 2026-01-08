import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { useRetailApi } from '@/hooks/useRetail';
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

describe('useRetailApi', () => {
    it('createSale shows success toast on success', async () => {
        const apiFetch = jest.fn().mockResolvedValue({ status: 'ok' });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useRetailApi(), { wrapper });
        await act(async () => {
            await result.current.createSale({
                productId: 1,
                quantity: 2,
            });
        });
        expect(toast.success).toHaveBeenCalledWith('Sale recorded');
    });

    it('createSale shows error toast on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useRetailApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.createSale({
                    productId: 1,
                    quantity: 2,
                });
            }),
        ).rejects.toThrow();
        expect(toast.error).toHaveBeenCalledWith('fail');
    });

    it('adjustInventory shows success toast on success', async () => {
        const apiFetch = jest.fn().mockResolvedValue({ status: 'ok' });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useRetailApi(), { wrapper });
        await act(async () => {
            await result.current.adjustInventory({
                productId: 1,
                delta: 5,
                reason: 'delivery',
            });
        });
        expect(toast.success).toHaveBeenCalledWith('Inventory adjusted');
    });

    it('adjustInventory shows error toast on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('oops'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useRetailApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.adjustInventory({
                    productId: 1,
                    delta: 5,
                    reason: 'delivery',
                });
            }),
        ).rejects.toThrow();
        expect(toast.error).toHaveBeenCalledWith('oops');
    });
});
