import { useCallback } from 'react';
import { ApiClient } from '@salonbw/api';
import { useRouter } from 'next/router';

const apiClient = new ApiClient(
    // We're using cookie-based auth, no token needed
    () => null,
    // Logout handler
    () => {
        // Redirect to login on unauthorized
        window.location.href = '/auth/login';
    },
    undefined,
    {
        // Include credentials for cookie-based auth
        requestInit: {
            credentials: 'include',
        },
    },
);

export function useApi() {
    const router = useRouter();

    // Enhanced request method that handles auth failures
    const request = useCallback(
        async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
            try {
                return await apiClient.request<T>(endpoint, init);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message === 'Unauthorized'
                ) {
                    // Redirect to login page with return URL
                    await router.push(
                        `/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`,
                    );
                }
                throw error;
            }
        },
        [router],
    );

    return { request };
}
