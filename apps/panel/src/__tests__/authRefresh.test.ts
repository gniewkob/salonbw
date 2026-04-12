import { ApiClient } from '@/api/apiClient';

describe('ApiClient token refresh', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
        localStorage.clear();
    });

    afterEach(() => {
        jest.resetAllMocks();
        localStorage.clear();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('retries request with refreshed token on 401', async () => {
        localStorage.setItem('refreshToken', 'old');
        let accessToken = 'oldToken';

        let callIndex = 0;
        (global.fetch as jest.Mock).mockImplementation(
            (input: RequestInfo | URL, init?: RequestInit) => {
                const current = callIndex++;
                if (current === 0) {
                    // initial protected request
                    const headers = new Headers(init?.headers);
                    expect(headers.get('Authorization')).toBe(
                        'Bearer oldToken',
                    );
                    return Promise.resolve(
                        new Response('Unauthorized', {
                            status: 401,
                            headers: { 'Content-Type': 'text/plain' },
                        }),
                    );
                }
                if (current === 1) {
                    // refresh token request
                    const url =
                        typeof input === 'string'
                            ? input
                            : input instanceof URL
                              ? input.toString()
                              : String(input);
                    expect(url).toContain('/auth/refresh');
                    return Promise.resolve(
                        new Response(
                            JSON.stringify({
                                access_token: 'newToken',
                                refresh_token: 'newRefresh',
                            }),
                            {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' },
                            },
                        ),
                    );
                }
                // retried request
                const headers = new Headers(init?.headers);
                expect(headers.get('Authorization')).toBe('Bearer newToken');
                return Promise.resolve(
                    new Response(JSON.stringify({ ok: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }),
                );
            },
        );

        const client = new ApiClient(
            () => accessToken,
            jest.fn(),
            (tokens) => {
                accessToken = tokens.accessToken;
                const refreshValue: string = tokens.refreshToken;
                localStorage.setItem('refreshToken', refreshValue);
            },
        );

        const result = await client.request<{ ok: boolean }>('/protected');
        expect(result).toEqual({ ok: true });
        expect(accessToken).toBe('newToken');
        expect(localStorage.getItem('refreshToken')).toBe('newRefresh');
        expect((global.fetch as jest.Mock).mock.calls).toHaveLength(3);
    });
});
