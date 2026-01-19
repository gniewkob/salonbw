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

describe('useReviewApi extra', () => {
    it('updates and deletes review', async () => {
        const apiFetch = jest
            .fn()
            .mockResolvedValueOnce({ id: 10, rating: 4 }) // update
            .mockResolvedValueOnce(undefined); // remove
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useReviewApi(), { wrapper });
        await act(async () => {
            await result.current.update(10, { rating: 4 });
        });
        expect(toast.success).toHaveBeenCalled();
        await act(async () => {
            await result.current.remove(10);
        });
        expect(toast.success).toHaveBeenCalled();
    });

    it('handles listForEmployee query params and errors', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('bad'));
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ToastProvider>{children}</ToastProvider>
        );
        const { result } = renderHook(() => useReviewApi(), { wrapper });
        await expect(
            act(async () => {
                await result.current.listForEmployee(1, {
                    page: 2,
                    limit: 5,
                    rating: 5,
                });
            }),
        ).rejects.toThrow();
        expect(toast.error).toHaveBeenCalled();
    });
});
