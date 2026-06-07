import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useEmployeeApi } from '@/api/employees';
import { useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('react-hot-toast', () => ({
    Toaster: () => null,
    toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useEmployeeApi extra', () => {
    it('updates and removes employee without throwing', async () => {
        const apiFetch = jest
            .fn()
            .mockResolvedValueOnce({
                id: 1,
                firstName: 'A',
                lastName: 'B',
                fullName: 'A B',
            }) // update
            .mockResolvedValueOnce(undefined); // remove
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useEmployeeApi(), { wrapper });
        await act(async () => {
            await result.current.update(1, { firstName: 'A', lastName: 'B' });
        });
        await act(async () => {
            await result.current.remove(1);
        });
        expect(apiFetch).toHaveBeenCalledTimes(2);
    });

    it('remove throws on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('bad'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useEmployeeApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.remove(1);
            }),
        ).rejects.toThrow('bad');
    });

    it('create throws on failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('oops'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useEmployeeApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.create({ firstName: 'A', lastName: 'B' });
            }),
        ).rejects.toThrow('oops');
    });
});
