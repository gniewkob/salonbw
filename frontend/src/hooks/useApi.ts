import { useCallback, useMemo } from 'react';
import { ApiClient } from '@salonbw/api';
import { useRouter } from 'next/router';

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

    const apiClient = useMemo(() => {
        return new ApiClient(
            () => null, // No token handling - using cookie-based auth
            // Logout handler - client-side only
            () => {
                if (typeof window === 'undefined') return;

                const currentPath = router.asPath;
                const loginUrl = `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`;

                // Use router for client-side navigation
                router.push(loginUrl).catch(() => {
                    // Fallback to direct navigation if router fails
                    window.location.href = loginUrl;
                });
            },
            undefined, // No token refresh handling
            {
                requestInit: {
                    credentials: 'include',
                },
            },
        );
    }, [router]);

    // Enhanced request method that handles auth failures
    const request = useCallback(
        async <T>(arg: RequestArg): Promise<T> => {
            const { endpoint, init, skipAuth } =
                typeof arg === 'string'
                    ? { endpoint: arg, init: undefined, skipAuth: false }
                    : arg;
            try {
                return await apiClient.request<T>(endpoint, init);
            } catch (error) {
                const apiError = error as ApiErrorResponse;
                if (!apiError?.status) {
                    throw error;
                }

                const errorDetails = {
                    code: apiError.code,
                    details: apiError.details,
                };

                switch (apiError.status) {
                    case 401:
                        if (!skipAuth) {
                            const loginUrl = `/auth/login?redirectTo=${encodeURIComponent(
                                router.asPath,
                            )}`;
                            try {
                                await router.push(loginUrl);
                            } catch {
                                if (typeof window !== 'undefined') {
                                    window.location.href = loginUrl;
                                }
                            }
                        }
                        throw new ApiError(
                            401,
                            'Unauthorized',
                            'UNAUTHORIZED',
                            errorDetails,
                        );
                    case 403:
                        throw new ApiError(
                            403,
                            'Access denied',
                            'FORBIDDEN',
                            errorDetails,
                        );
                    case 404:
                        throw new ApiError(
                            404,
                            'Resource not found',
                            'NOT_FOUND',
                            errorDetails,
                        );
                    case 429:
                        throw new ApiError(
                            429,
                            'Too many requests',
                            'RATE_LIMITED',
                            errorDetails,
                        );
                    default:
                        throw new ApiError(
                            apiError.status,
                            apiError.message || 'Unknown error occurred',
                            apiError.code || 'UNKNOWN_ERROR',
                            errorDetails,
                        );
                }
            }
        },
        [apiClient, router],
    );

    return { request };
}
