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

describe('useReviewApi', () => {
  it('shows success toast on create', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ id: 1, rating: 5 });
    mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    const { result } = renderHook(() => useReviewApi(), { wrapper });
    await act(async () => {
      await result.current.create(1, { rating: 5 });
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows error toast on failure', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('fail'));
    mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    const { result } = renderHook(() => useReviewApi(), { wrapper });
    await expect(
      act(async () => {
        await result.current.create(1, { rating: 5 });
      })
    ).rejects.toThrow();
    expect(toast.error).toHaveBeenCalled();
  });
});
