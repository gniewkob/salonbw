import { useCallback, useMemo } from 'react';
import { ApiClient } from '@salonbw/api';
import { useRouter } from 'next/router';
import type { NextRouter } from 'next/router';

interface ApiErrorResponse {
    status: number;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}

interface RequestConfig {
    endpoint: string;
    init?: RequestInit;
    skipAuth?: boolean;
}

// Allow calling request with just an endpoint string for convenience
type RequestArg = string | RequestConfig;

class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly code?: string,
        public readonly details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function useApi() {
    const router = useRouter();

    const apiClient = useMemo(
        () =>
            new ApiClient(
                () => null, // No token handling - using cookie-based auth
                () => redirectToLogin(router),
                undefined, // No token refresh handling
                {
                    requestInit: {
                        credentials: 'include',
                    },
                },
            ),
        [router],
    );

    // Enhanced request method that handles auth failures
    const request = useCallback(
        async <T>(arg: RequestArg): Promise<T> => {
            const { endpoint, init, skipAuth } = normalizeRequestArg(arg);
            try {
                return await apiClient.request<T>(endpoint, init);
            } catch (error) {
                throw await handleApiError(
                    error as ApiErrorResponse,
                    router,
                    skipAuth,
                );
            }
        },
        [apiClient, router],
    );

    return { request };
}

function normalizeRequestArg(arg: RequestArg): RequestConfig {
    if (typeof arg === 'string') {
        return { endpoint: arg, init: undefined, skipAuth: false };
    }
    return arg;
}

function redirectToLogin(router: NextRouter) {
    if (typeof window === 'undefined') return;

    const loginUrl = `/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`;
    void router.push(loginUrl).catch(() => {
        window.location.href = loginUrl;
    });
}

async function handleApiError(
    apiError: ApiErrorResponse,
    router: NextRouter,
    skipAuth?: boolean,
): Promise<never> {
    if (!apiError?.status) {
        throw apiError;
    }

    const errorDetails = {
        code: apiError.code,
        details: apiError.details,
    };

    if (apiError.status === 401 && !skipAuth) {
        await redirectToLogin(router);
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED', errorDetails);
    }

    const errorByStatus: Record<number, ApiError> = {
        403: new ApiError(403, 'Access denied', 'FORBIDDEN', errorDetails),
        404: new ApiError(404, 'Resource not found', 'NOT_FOUND', errorDetails),
        429: new ApiError(
            429,
            'Too many requests',
            'RATE_LIMITED',
            errorDetails,
        ),
    };

    const mapped = errorByStatus[apiError.status];
    if (mapped) {
        throw mapped;
    }

    throw new ApiError(
        apiError.status,
        apiError.message || 'Unknown error occurred',
        apiError.code || 'UNKNOWN_ERROR',
        errorDetails,
    );
}
