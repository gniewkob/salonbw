import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { usePaymentsApi } from '@/api/payments';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('usePaymentsApi', () => {
  it('creates session and returns url', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ url: 'u' });
    mockedUseAuth.mockReturnValue({ apiFetch } as any);
    const { result } = renderHook(() => usePaymentsApi());
    let url: string | null = null;
    await act(async () => { url = await result.current.createSession(1); });
    expect(url).toBe('u');
  });
});
