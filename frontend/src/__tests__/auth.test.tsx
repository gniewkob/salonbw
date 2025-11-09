import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

jest.mock('@/api/auth', () => ({
    login: jest
        .fn()
        .mockResolvedValue({ accessToken: 'abc', refreshToken: 'def' }),
    register: jest.fn(),
    refreshToken: jest
        .fn()
        .mockResolvedValue({ accessToken: 'abc', refreshToken: 'def' }),
    REFRESH_TOKEN_KEY: 'refreshToken',
    setLogoutCallback: jest.fn(),
}));

const requestMock = jest.fn();
jest.mock('@/api/apiClient', () => ({
    ApiClient: jest.fn().mockImplementation(() => ({
        request: requestMock,
    })),
}));

describe('auth flow', () => {
    it('login fetches token and fetches clients then logout clears token', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(AuthProvider, null, children);
        const { result } = renderHook(() => useAuth(), { wrapper });

        requestMock.mockResolvedValueOnce({ role: 'admin' });
        await act(async () => {
            await result.current.login('a', 'b');
        });

        requestMock.mockResolvedValueOnce([{ id: 1, name: 'John' }]);
        await act(async () => {
            const clients =
                await result.current.apiFetch<{ id: number; name: string }[]>(
                    '/clients',
                );
            expect(clients[0].name).toBe('John');
        });

        await act(async () => {
            await result.current.logout();
        });
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('logs out when refresh token fails', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(AuthProvider, null, children);
        const { result } = renderHook(() => useAuth(), { wrapper });

        requestMock.mockResolvedValueOnce({ role: 'admin' });
        await act(async () => {
            await result.current.login('a', 'b');
        });

        const { refreshToken: refreshMock } = require('@/api/auth');
        (refreshMock as jest.Mock).mockRejectedValueOnce(new Error('fail'));

        await act(async () => {
            await expect(result.current.refresh()).rejects.toThrow();
        });

        expect(result.current.isAuthenticated).toBe(false);
    });
});
