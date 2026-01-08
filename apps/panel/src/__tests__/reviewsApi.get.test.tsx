import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useReviewApi } from '@/api/reviews';
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

describe('useReviewApi get', () => {
    it('returns review from get', async () => {
        const apiFetch = jest.fn().mockResolvedValue({ id: 11, rating: 4 });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useReviewApi(), { wrapper });
        await act(async () => {
            const r = await result.current.get(99);
            expect(r.id).toBe(11);
        });
    });

    it('shows error on get failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useReviewApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.get(1);
            }),
        ).rejects.toThrow();
        expect(toast.error).toHaveBeenCalled();
    });
});
