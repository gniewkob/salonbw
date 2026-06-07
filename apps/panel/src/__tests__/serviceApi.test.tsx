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

describe('useServiceApi', () => {
    it('returns created service', async () => {
        const service = { id: 1, name: 'A' };
        const apiFetch = jest.fn().mockResolvedValue(service);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useServiceApi(), { wrapper });
        let created: unknown;
        await act(async () => {
            created = await result.current.create({ name: 'A' });
        });
        expect(created).toEqual(service);
    });

    it('throws on create failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useServiceApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.create({ name: 'A' });
            }),
        ).rejects.toThrow('fail');
    });
});
