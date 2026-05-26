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

describe('AuthContext localStorage', () => {
    it('login stores tokens and user, logout clears them', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.login('e', 'p');
        });
        await waitFor(() => expect(result.current.user).toEqual(profile));
        expect(localStorage.getItem('jwtToken')).toBe('a');
        // Refresh token is intentionally httpOnly-cookie only (not localStorage).
        expect(localStorage.getItem('refreshToken')).toBeNull();

        await act(async () => {
            await result.current.logout();
        });
        expect(localStorage.getItem('jwtToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    });
});
