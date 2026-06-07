import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useProductApi } from '@/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('react-hot-toast', () => ({
    Toaster: () => null,
    toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useProductApi extra', () => {
    it('updates product and updates stock without throwing', async () => {
        const apiFetch = jest
            .fn()
            .mockResolvedValueOnce({
                id: 1,
                name: 'A',
                unitPrice: 2,
                stock: 1,
            }) // update
            .mockResolvedValueOnce({
                id: 1,
                name: 'A',
                unitPrice: 2,
                stock: 3,
            }); // stock
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useProductApi(), { wrapper });
        await act(async () => {
            await result.current.update(1, { unitPrice: 2 });
        });
        await act(async () => {
            await result.current.updateStock(1, 3);
        });
        expect(apiFetch).toHaveBeenCalledTimes(2);
    });

    it('remove throws on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useProductApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.remove(1);
            }),
        ).rejects.toThrow('fail');
    });

    it('update throws on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('bad'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useProductApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.update(1, { name: 'X' });
            }),
        ).rejects.toThrow('bad');
    });

    it('updateStock throws on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('nope'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useProductApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.updateStock(1, 5);
            }),
        ).rejects.toThrow('nope');
    });
});
