import type { paths } from './schema';

export interface ApiError extends Error {
    status?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

type ServerTokens =
    | { access_token: string; refresh_token: string }
    | { accessToken: string; refreshToken: string };

function mapTokens(tokens: ServerTokens): AuthTokens {
    if ('access_token' in tokens) {
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        };
    }
    return tokens;
}

type SuccessResponse<T> = T extends {
    responses: infer Responses;
}
    ? Responses extends Record<string, unknown>
        ? 200 extends keyof Responses
            ? JsonPayload<Responses[200]>
            : 201 extends keyof Responses
              ? JsonPayload<Responses[201]>
              : 204 extends keyof Responses
                ? void
                : unknown
        : unknown
    : unknown;

type JsonPayload<T> = T extends {
    content: infer Content;
}
    ? Content extends { 'application/json': infer Json }
        ? Json
        : Content extends { '*/*': infer Any }
          ? Any
          : unknown
    : unknown;

type RequestBody<T> = T extends {
    requestBody: { content: { 'application/json': infer Body } };
}
    ? Body
    : undefined;

type QueryParams<T> = T extends { parameters: { query: infer Query } }
    ? Query
    : undefined;

type PathParams<T> = T extends { parameters: { path: infer PathParams } }
    ? PathParams
    : undefined;

export interface TypedRequest<
    Path extends keyof paths,
    Method extends keyof paths[Path],
> {
    path: Path;
    method: Method;
    query?: QueryParams<paths[Path][Method]>;
    pathParams?: PathParams<paths[Path][Method]>;
    body?: RequestBody<paths[Path][Method]>;
    headers?: HeadersInit;
}

export interface ApiClientOptions {
    baseUrl?: string;
    getRefreshToken?: () => string | null;
}

export class ApiClient {
    private readonly baseUrl: string;

    constructor(
        private readonly getAccessToken: () => string | null,
        private readonly onLogout: () => void,
        private readonly onTokenRefresh?: (tokens: AuthTokens) => void,
        private readonly options: ApiClientOptions = {},
    ) {
        this.baseUrl =
            options.baseUrl ??
            process.env.NEXT_PUBLIC_API_URL ??
            'http://localhost:3000';
    }

    private getRefreshToken(): string | null {
        if (this.options.getRefreshToken) {
            return this.options.getRefreshToken();
        }
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('refreshToken');
        }
        return null;
    }

    private buildUrl(
        endpoint: string,
        query?: Record<string, unknown> | undefined,
    ): string {
        const url =
            endpoint.startsWith('http://') || endpoint.startsWith('https://')
                ? endpoint
                : `${this.baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        if (!query || Object.keys(query).length === 0) {
            return url;
        }
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null) continue;
            if (Array.isArray(value)) {
                value.forEach((v) => params.append(key, String(v)));
            } else {
                params.append(key, String(value));
            }
        }
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${params.toString()}`;
    }

    private async refreshTokens(): Promise<AuthTokens | null> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return null;
        }
        try {
            const response = await fetch(this.buildUrl('/auth/refresh'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ refreshToken }),
            });
            if (!response.ok) {
                return null;
            }
            const raw = (await response.json()) as ServerTokens;
            const tokens = mapTokens(raw);
            this.onTokenRefresh?.(tokens);
            return tokens;
        } catch {
            return null;
        }
    }

    private async execute<T>(
        endpoint: string,
        init: RequestInit = {},
        retry = true,
    ): Promise<T> {
        const headers = new Headers(init.headers ?? {});
        if (!headers.has('Content-Type') && init.body) {
            headers.set('Content-Type', 'application/json');
        }
        const token = this.getAccessToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        const response = await fetch(this.buildUrl(endpoint), {
            ...init,
            headers,
            credentials: 'include',
        });
        if (response.status === 401 && retry) {
            const tokens = await this.refreshTokens();
            if (tokens) {
                headers.set('Authorization', `Bearer ${tokens.accessToken}`);
                const retryResponse = await fetch(this.buildUrl(endpoint), {
                    ...init,
                    headers,
                    credentials: 'include',
                });
                return this.handleResponse<T>(retryResponse);
            }
            this.onLogout();
            throw this.createError(response, 'Unauthorized');
        }
        if (response.status === 401) {
            this.onLogout();
        }
        return this.handleResponse<T>(response);
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const reqId = response.headers.get('x-request-id');
        const debug =
            (typeof process !== 'undefined' &&
                process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') ||
            (typeof window !== 'undefined' &&
                window.localStorage?.getItem('DEBUG_API') === '1');
        if (reqId && debug && typeof console !== 'undefined') {
            // Lightweight correlation hint in dev
            // eslint-disable-next-line no-console
            console.debug('[api] x-request-id:', reqId);
        }
        if (response.status === 204) {
            return undefined as T;
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!response.ok) {
            if (contentType.includes('application/json')) {
                const data = (await response.json()) as {
                    message?: string;
                };
                throw this.createError(response, data.message);
            }
            const text = await response.text();
            throw this.createError(response, text || response.statusText);
        }
        if (contentType.includes('application/json')) {
            return (await response.json()) as T;
        }
        if (contentType.includes('text/')) {
            const text = await response.text();
            return (text ? (text as unknown as T) : (undefined as T));
        }
        return undefined as T;
    }

    private createError(response: Response, message?: string): ApiError {
        const error: ApiError = new Error(message || response.statusText);
        error.status = response.status;
        return error;
    }

    async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
        return this.execute<T>(endpoint, init);
    }

    async requestTyped<
        Path extends keyof paths,
        Method extends keyof paths[Path],
    >(
        request: TypedRequest<Path, Method>,
    ): Promise<SuccessResponse<paths[Path][Method]>> {
        const operation = request;
        const method = String(operation.method).toUpperCase();
        let path = String(operation.path);
        if (operation.pathParams) {
            for (const [key, value] of Object.entries(operation.pathParams)) {
                path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
            }
        }
        const body =
            operation.body !== undefined
                ? JSON.stringify(operation.body)
                : undefined;
        return this.execute(
            this.buildUrl(path, operation.query as Record<string, unknown>),
            {
                method,
                body,
                headers: operation.headers,
            },
        );
    }
}
