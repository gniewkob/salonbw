import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiError extends Error {
    status?: number;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export class ApiClient {
    private axios: AxiosInstance;

    constructor(
        private getToken: () => string | null,
        private onLogout: () => void,
        private onTokenRefresh?: (tokens: AuthTokens) => void,
    ) {
        this.axios = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost',
            withCredentials: true,
        });

        this.axios.interceptors.request.use((config) => {
            const token = this.getToken();
            if (token) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        this.axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const err = error as AxiosError<unknown> & {
                    config: AxiosRequestConfig & { _retry?: boolean };
                };

                const { response, config } = err;

                if (
                    response?.status === 401 &&
                    !config._retry &&
                    config.url !== '/auth/refresh'
                ) {
                    const refreshToken =
                        typeof localStorage !== 'undefined'
                            ? localStorage.getItem('refreshToken')
                            : null;
                    if (refreshToken) {
                        try {
                            const { data } = await this.axios.post<AuthTokens>(
                                '/auth/refresh',
                                { refreshToken },
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                },
                            );
                            this.onTokenRefresh?.(data);
                            config._retry = true;
                            config.headers = config.headers ?? {};
                            config.headers.Authorization = `Bearer ${data.accessToken}`;
                            return this.axios(config);
                        } catch (refreshErr) {
                            this.onLogout();
                            return Promise.reject(
                                this.createError(
                                    refreshErr as AxiosError<unknown>,
                                ),
                            );
                        }
                    } else {
                        this.onLogout();
                    }
                }

                return Promise.reject(
                    this.createError(err as AxiosError<unknown>),
                );
            },
        );
    }

    private createError(error: AxiosError<unknown>): ApiError {
        let message: string;
        if (error.response) {
            const data = error.response.data as { message?: string } | undefined;
            message = data?.message || error.response.statusText;
        } else if (error.request) {
            message = 'Network error';
        } else {
            message = error.message;
        }
        const apiError: ApiError = new Error(message);
        apiError.status = error.response?.status;
        return apiError;
    }

    async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
        const config: AxiosRequestConfig = {
            url: endpoint,
            method: init.method as AxiosRequestConfig['method'],
            headers: init.headers as Record<string, string>,
            data: init.body as unknown,
        };
        try {
            const res = await this.axios.request<T>(config);
            if (res.status === 204 || res.data === '') {
                return undefined as T;
            }
            return res.data;
        } catch (error: unknown) {
            const err = error as AxiosError<unknown>;
            console.error(
                'API request failed',
                err.response?.data || err.message,
            );
            throw this.createError(err);
        }
    }
}
