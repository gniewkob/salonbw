import type { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

export const createAuthValue = (
    overrides: Partial<ReturnType<typeof useAuth>> = {},
): ReturnType<typeof useAuth> => ({
    user: null as User | null,
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
