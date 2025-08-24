import { ApiClient } from './apiClient';
import { User } from '@/types';

let logoutCallback: () => void = () => {};

export function setLogoutCallback(cb: () => void) {
    logoutCallback = cb;
}

const client = new ApiClient(
    () => null,
    () => logoutCallback(),
);

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export const REFRESH_TOKEN_KEY = 'refreshToken';

export async function login(
    credentials: LoginCredentials,
): Promise<AuthTokens> {
    try {
        return await client.request<AuthTokens>('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
    } catch (err: unknown) {
        throw new Error(err instanceof Error ? err.message : 'Login failed');
    }
}

export async function register(data: RegisterData): Promise<User> {
    try {
        return await client.request<User>('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    } catch (err: unknown) {
        throw new Error(
            err instanceof Error ? err.message : 'Registration failed',
        );
    }
}

export async function refreshToken(): Promise<AuthTokens> {
    try {
        const refreshToken =
            typeof localStorage !== 'undefined'
                ? localStorage.getItem(REFRESH_TOKEN_KEY)
                : null;
        return await client.request<AuthTokens>('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
    } catch (err: unknown) {
        throw new Error(
            err instanceof Error ? err.message : 'Token refresh failed',
        );
    }
}
