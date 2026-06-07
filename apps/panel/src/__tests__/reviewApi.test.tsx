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

describe('useReviewApi', () => {
    it('returns created review', async () => {
        const review = { id: 1, rating: 5 };
        const apiFetch = jest.fn().mockResolvedValue(review);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useReviewApi(), { wrapper });
        let created: unknown;
        await act(async () => {
            created = await result.current.create(1, { rating: 5 });
        });
        expect(created).toEqual(review);
    });

    it('throws on create failure', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useReviewApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.create(1, { rating: 5 });
            }),
        ).rejects.toThrow('fail');
    });
});
