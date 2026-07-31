import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
    AuthProvider,
    useAuth,
    resolveSessionExpiredRedirect,
} from '@/contexts/AuthContext';

jest.mock('@/api/auth', () => ({
    login: jest
        .fn()
        .mockResolvedValue({ accessToken: 'abc', refreshToken: 'def' }),
    register: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
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

describe('resolveSessionExpiredRedirect', () => {
    // Regression guard for the underlying bug: an expired session mid-browse
    // used to reuse the explicit-logout redirect (public marketing site)
    // instead of sending staff back to the login screen. jsdom's real
    // `window.location.href` setter is a no-op and the property can't be
    // redefined in this jsdom version, so the redirect-target logic is
    // tested as a pure function rather than end-to-end through navigation.
    it('returns /auth/login with the current page preserved as redirectTo', () => {
        expect(
            resolveSessionExpiredRedirect('/statistics', '?date=2026-07-30'),
        ).toBe('/auth/login?redirectTo=%2Fstatistics%3Fdate%3D2026-07-30');
    });

    it('does not nest a redirectTo when already on the login page', () => {
        expect(
            resolveSessionExpiredRedirect(
                '/auth/login',
                '?redirectTo=%2Fvisits',
            ),
        ).toBe('/auth/login');
    });

    it('falls back to /auth/login for an empty path', () => {
        expect(resolveSessionExpiredRedirect('', '')).toBe('/auth/login');
    });
});

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
                    '/customers',
                );
            expect(clients[0].name).toBe('John');
        });

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        await act(async () => {
            await result.current.logout();
        });
        consoleErrorSpy.mockRestore();
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

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        await act(async () => {
            await expect(result.current.refresh()).rejects.toThrow();
        });
        consoleErrorSpy.mockRestore();

        expect(result.current.isAuthenticated).toBe(false);
    });
});
