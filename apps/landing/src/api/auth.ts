import { ApiClient } from './apiClient';
import Cookies from 'js-cookie';
import { User } from '@/types';

let logoutCallback: () => void = () => {};

export function setLogoutCallback(cb: () => void) {
    logoutCallback = cb;
}

const client = new ApiClient(
    () => null,
    () => logoutCallback(),
    undefined,
    { baseUrl: process.env.NEXT_PUBLIC_API_URL },
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

type ServerTokens =
    | { access_token: string; refresh_token: string }
    | { accessToken: string; refreshToken: string };

function mapTokens(input: unknown): AuthTokens {
    if (
        typeof input === 'object' &&
        input !== null &&
        ('access_token' in input || 'accessToken' in input)
    ) {
        const tokens = input as ServerTokens;
        if ('access_token' in tokens) {
            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
            };
        }
        return tokens;
    }
    throw new Error('Invalid token response');
}

export const REFRESH_TOKEN_KEY = 'refreshToken';

export async function login(
    credentials: LoginCredentials,
): Promise<AuthTokens> {
    try {
        const raw = await client.request<ServerTokens>('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return mapTokens(raw);
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
            (typeof localStorage !== 'undefined'
                ? localStorage.getItem(REFRESH_TOKEN_KEY)
                : null) ||
            (typeof document !== 'undefined'
                ? Cookies.get(REFRESH_TOKEN_KEY)
                : null);
        const raw = await client.request<ServerTokens>('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        return mapTokens(raw);
    } catch (err: unknown) {
        throw new Error(
            err instanceof Error ? err.message : 'Token refresh failed',
        );
    }
}

export async function logout(): Promise<void> {
    await client.request('/auth/logout', {
        method: 'POST',
        headers: { 'x-skip-logout': 'true' },
    });
}
