import { ApiClient } from './apiClient';
import type { ApiError } from '@salonbw/api';
import { User } from '@/types';

let logoutCallback: () => void = () => {};

export function setLogoutCallback(cb: () => void) {
    logoutCallback = cb;
}

// Re-wrap an unknown error as an Error while preserving ApiError.status, so
// callers (login forms, retry logic, telemetry) can still differentiate
// 400 (invalid credentials) from 401 (unauthorized) from 5xx (transient).
function rethrowWithStatus(err: unknown, fallbackMessage: string): never {
    if (err instanceof Error) {
        const wrapped: ApiError = new Error(err.message);
        const status = (err as ApiError).status;
        if (typeof status === 'number') {
            wrapped.status = status;
        }
        throw wrapped;
    }
    throw new Error(fallbackMessage);
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
    gdprConsent: boolean;
    termsConsent: boolean;
    smsConsent?: boolean;
    whatsappConsent?: boolean;
    emailConsent?: boolean;
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
        rethrowWithStatus(err, 'Login failed');
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
        rethrowWithStatus(err, 'Registration failed');
    }
}

export async function refreshToken(): Promise<AuthTokens> {
    try {
        // The refresh token lives in an httpOnly cookie set by the backend.
        // `credentials: 'include'` on the ApiClient request attaches it; the
        // backend `/auth/refresh` controller reads `req.cookies.refreshToken`
        // when the body is empty.
        const raw = await client.request<ServerTokens>('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        return mapTokens(raw);
    } catch (err: unknown) {
        rethrowWithStatus(err, 'Token refresh failed');
    }
}

export async function logout(): Promise<void> {
    await client.request('/auth/logout', {
        method: 'POST',
        headers: { 'x-skip-logout': 'true' },
    });
}
