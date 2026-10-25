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
        localStorage.setItem('jwtToken', 'stale-from-previous-build');
        localStorage.setItem('refreshToken', 'stale-from-previous-build');
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('does not reuse production session hints on the development landing', async () => {
        const previous = process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX;
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX = 'dev_';
        document.cookie = 'sbw_auth=1; path=/';
        requestMock.mockClear();
        try {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );
            const { result } = renderHook(() => useAuth(), { wrapper });
            await waitFor(() => expect(result.current.initialized).toBe(true));
            expect(requestMock).not.toHaveBeenCalled();
            expect(document.cookie).toContain('sbw_auth=1');
        } finally {
            if (previous === undefined)
                delete process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX;
            else process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX = previous;
            document.cookie = 'sbw_auth=; Max-Age=0; path=/';
        }
    });

    it('login fetches profile without writing tokens to JS-accessible storage', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.login('e', 'p');
        });
        await waitFor(() => expect(result.current.user).toEqual(profile));
        expect(result.current.isAuthenticated).toBe(true);

        // Auth tokens are backend-managed httpOnly cookies. The landing app
        // must not write JS-readable copies during login, and it should clean
        // legacy localStorage tokens left by older builds.
        expect(localStorage.getItem('jwtToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();

        await act(async () => {
            await result.current.logout();
        });
        await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    });
});
