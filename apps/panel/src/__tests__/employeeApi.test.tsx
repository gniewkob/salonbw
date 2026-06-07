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

describe('useEmployeeApi', () => {
    it('returns created employee on create', async () => {
        const employee = {
            id: 1,
            firstName: 'A',
            lastName: 'B',
            fullName: 'A B',
        };
        const apiFetch = jest.fn().mockResolvedValue(employee);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useEmployeeApi(), { wrapper });
        let created: unknown;
        await act(async () => {
            created = await result.current.create({
                firstName: 'A',
                lastName: 'B',
            });
        });
        expect(created).toEqual(employee);
    });

    it('throws on create failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useEmployeeApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.create({ firstName: 'A', lastName: 'B' });
            }),
        ).rejects.toThrow('fail');
    });
});
