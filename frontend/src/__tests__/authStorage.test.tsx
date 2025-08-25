import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

jest.mock('@/api/auth', () => ({
    login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
    register: jest.fn(),
    refreshToken: jest.fn(),
    REFRESH_TOKEN_KEY: 'refreshToken',
    setLogoutCallback: jest.fn(),
}));

const profile = { id: 1, name: 'Jane', role: 'admin' };
const requestMock = jest.fn().mockResolvedValue(profile);
jest.mock('@/api/apiClient', () => ({
    ApiClient: jest.fn().mockImplementation(() => ({ request: requestMock })),
}));

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
        expect(localStorage.getItem('refreshToken')).toBe('r');

        act(() => {
            result.current.logout();
        });
        expect(localStorage.getItem('jwtToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(result.current.user).toBeNull();
    });
});
