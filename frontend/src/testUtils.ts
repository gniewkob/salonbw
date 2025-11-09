import { jest } from '@jest/globals';
import type { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

type AuthValue = ReturnType<typeof useAuth>;
const asyncMock = <Args extends unknown[], Result>() =>
    jest.fn(async (...args: Args) => {
        void args;
        return undefined as Result;
    }) as (...args: Args) => Promise<Result>;

export const createAuthValue = (
    overrides: Partial<AuthValue> = {},
): AuthValue => ({
    user: null as User | null,
    role: null,
    initialized: true,
    isAuthenticated: false,
    login: asyncMock<
        Parameters<AuthValue['login']>,
        Awaited<ReturnType<AuthValue['login']>>
    >(),
    register: asyncMock<
        Parameters<AuthValue['register']>,
        Awaited<ReturnType<AuthValue['register']>>
    >(),
    logout: asyncMock<
        Parameters<AuthValue['logout']>,
        Awaited<ReturnType<AuthValue['logout']>>
    >(),
    refresh: asyncMock<
        Parameters<AuthValue['refresh']>,
        Awaited<ReturnType<AuthValue['refresh']>>
    >(),
    apiFetch: jest.fn(async (...args: Parameters<AuthValue['apiFetch']>) => {
        void args;
        return undefined as Awaited<ReturnType<AuthValue['apiFetch']>>;
    }) as unknown as AuthValue['apiFetch'],
    ...overrides,
});
