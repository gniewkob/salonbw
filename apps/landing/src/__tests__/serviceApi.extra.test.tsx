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
const toast = require('react-hot-toast').toast;

describe('useServiceApi extra', () => {
    it('updates service', async () => {
        const apiFetch = jest.fn().mockResolvedValue({ id: 1, name: 'B' });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useServiceApi(), { wrapper });
        await act(async () => {
            await result.current.update(1, { name: 'B' });
        });
        expect(toast.success).toHaveBeenCalled();
    });

    it('remove shows error on failure', async () => {
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
        ).rejects.toThrow();
        expect(toast.error).toHaveBeenCalled();
    });

    it('create shows error on failure', async () => {
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
        ).rejects.toThrow();
        expect(toast.error).toHaveBeenCalled();
    });
});
