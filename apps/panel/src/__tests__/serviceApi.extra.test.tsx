import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useServiceApi } from '@/api/services';
import { useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('react-hot-toast', () => ({
    Toaster: () => null,
    toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useServiceApi extra', () => {
    it('updates and removes service without throwing', async () => {
        const apiFetch = jest
            .fn()
            .mockResolvedValueOnce({ id: 1, name: 'B' }) // update
            .mockResolvedValueOnce(undefined); // remove
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useServiceApi(), { wrapper });
        await act(async () => {
            await result.current.update(1, { name: 'B' });
        });
        await act(async () => {
            await result.current.remove(1);
        });
        expect(apiFetch).toHaveBeenCalledTimes(2);
    });

    it('remove throws on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useServiceApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.remove(1);
            }),
        ).rejects.toThrow('fail');
    });

    it('create throws on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('nope'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useServiceApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.create({ name: 'A' });
            }),
        ).rejects.toThrow('nope');
    });
});
