import type { useAuth } from '@/contexts/AuthContext';

export const createAuthValue = (
    overrides: Partial<ReturnType<typeof useAuth>> = {},
): ReturnType<typeof useAuth> => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    role: null,
    isAuthenticated: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    apiFetch: jest.fn(),
    ...overrides,
});
