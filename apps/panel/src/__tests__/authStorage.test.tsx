import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

jest.mock('@/api/auth', () => ({
    login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
    register: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    refreshToken: jest.fn(),
    REFRESH_TOKEN_KEY: 'refreshToken',
    setLogoutCallback: jest.fn(),
}));

const profile = { id: 1, name: 'Jane', role: 'admin' };
const requestMock = jest.fn().mockResolvedValue(profile);
jest.mock('@/api/apiClient', () => ({
    ApiClient: jest.fn().mockImplementation(() => ({ request: requestMock })),
}));

const originalFetch = global.fetch;

beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
    } as Response);
});

afterEach(() => {
    global.fetch = originalFetch;
});

describe('AuthContext session lifecycle', () => {
    beforeEach(() => {
        // Seed any token-like values to make sure the provider does NOT
        // resurrect them — auth state must rely solely on backend httpOnly
        // cookies that JS cannot read.
        localStorage.setItem('jwtToken', 'stale-from-previous-build');
        localStorage.setItem('refreshToken', 'stale-from-previous-build');
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('login fetches profile and updates auth state without writing tokens to JS-accessible storage', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.login('e', 'p');
        });
        await waitFor(() => expect(result.current.user).toEqual(profile));
        expect(result.current.isAuthenticated).toBe(true);

        // The panel must never persist tokens to localStorage (XSS-readable).
        // Any stale values from older builds are left untouched here — they
        // are inert because hasAuthHint no longer consults them — but the
        // provider must not be the one writing them.
        expect(localStorage.getItem('jwtToken')).toBe(
            'stale-from-previous-build',
        );
        expect(localStorage.getItem('refreshToken')).toBe(
            'stale-from-previous-build',
        );

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        await act(async () => {
            await result.current.logout();
        });
        consoleErrorSpy.mockRestore();
        await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
        expect(result.current.user).toBeNull();
    });
});
