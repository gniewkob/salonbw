import type { useAuth } from '@/contexts/AuthContext';

export const createAuthValue = (
    overrides: Partial<ReturnType<typeof useAuth>> = {},
): ReturnType<typeof useAuth> => ({
    token: null,
    role: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    apiFetch: jest.fn(),
    ...overrides,
});
