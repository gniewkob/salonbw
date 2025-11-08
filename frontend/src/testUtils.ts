import { jest } from '@jest/globals';
import type { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

type AuthValue = ReturnType<typeof useAuth>;

const asyncMock = <Fn extends (...args: unknown[]) => Promise<unknown>>() =>
    jest.fn(async (...args: Parameters<Fn>) => {
        void args;
        return undefined as Awaited<ReturnType<Fn>>;
    }) as unknown as Fn;

export const createAuthValue = (
    overrides: Partial<AuthValue> = {},
): AuthValue => ({
    user: null as User | null,
    role: null,
    initialized: true,
    isAuthenticated: false,
    login: asyncMock<AuthValue['login']>(),
    register: asyncMock<AuthValue['register']>(),
    logout: asyncMock<AuthValue['logout']>(),
    refresh: asyncMock<AuthValue['refresh']>(),
    apiFetch: jest.fn(async (...args: Parameters<AuthValue['apiFetch']>) => {
        void args;
        return undefined as Awaited<ReturnType<AuthValue['apiFetch']>>;
    }) as unknown as AuthValue['apiFetch'],
    ...overrides,
});
