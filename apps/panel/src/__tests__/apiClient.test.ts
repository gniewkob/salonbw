import { ApiClient } from '@/api/apiClient';

describe('ApiClient', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('uses the configured CSRF namespace when production cookies are also present', async () => {
        document.cookie = 'XSRF-TOKEN=production-fixture; path=/';
        document.cookie = 'dev_XSRF-TOKEN=development-fixture; path=/';
        const client = new ApiClient(
            () => null,
            () => {},
            undefined,
            { csrfCookieName: 'dev_XSRF-TOKEN' },
        );
        (global.fetch as jest.Mock).mockImplementation(
            (_url: string, init: RequestInit) => {
                expect(new Headers(init.headers).get('X-XSRF-TOKEN')).toBe(
                    'development-fixture',
                );
                return Promise.resolve(
                    new Response('{}', {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }),
                );
            },
        );
        try {
            await client.request('/test', { method: 'POST' });
        } finally {
            document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
            document.cookie = 'dev_XSRF-TOKEN=; Max-Age=0; path=/';
        }
    });

    it('preserves gateway authentication when refreshing cookie-based sessions', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
            undefined,
            {
                cookieAuthOnly: true,
                headers: { Authorization: 'Basic gateway-fixture' },
            },
        );
        let calls = 0;
        (global.fetch as jest.Mock).mockImplementation(
            (url: string, init: RequestInit) => {
                calls++;
                if (String(url).endsWith('/auth/refresh'))
                    return Promise.resolve(
                        new Response(
                            JSON.stringify({
                                access_token: 'renewed-fixture',
                                refresh_token: 'refresh-fixture',
                            }),
                            {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' },
                            },
                        ),
                    );
                if (calls === 1)
                    return Promise.resolve(
                        new Response('Expired', { status: 401 }),
                    );
                expect(new Headers(init.headers).get('Authorization')).toBe(
                    'Basic gateway-fixture',
                );
                return Promise.resolve(
                    new Response('{}', {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }),
                );
            },
        );
        await client.request('/test');
        expect(calls).toBe(3);
    });

    it('adds Authorization header when token is present', async () => {
        const client = new ApiClient(
            () => 't',
            () => {},
        );
        (global.fetch as jest.Mock).mockImplementation(
            (input: RequestInfo | URL, init?: RequestInit) => {
                expect(typeof input).toBe('string');
                const headers = new Headers(init?.headers);
                expect(headers.get('Authorization')).toBe('Bearer t');
                return Promise.resolve(
                    new Response(JSON.stringify({}), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }),
                );
            },
        );
        await client.request('/test');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('calls logout callback on 401 responses', async () => {
        const onLogout = jest.fn();
        const client = new ApiClient(() => null, onLogout, undefined, {
            getRefreshToken: () => null,
        });
        (global.fetch as jest.Mock).mockResolvedValue(
            new Response('Unauthorized', {
                status: 401,
                headers: { 'Content-Type': 'text/plain' },
            }),
        );
        await expect(client.request('/test')).rejects.toThrow('Unauthorized');
        expect(onLogout).toHaveBeenCalled();
    });

    it('propagates error messages from the server', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        const message = 'Bad things happened';
        (global.fetch as jest.Mock).mockResolvedValue(
            new Response(JSON.stringify({ message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        await client.request('/test').catch((err) => {
            expect(err).toHaveProperty('message', message);
        });
    });

    it('returns undefined for 204 responses', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        (global.fetch as jest.Mock).mockResolvedValue(
            new Response(null, { status: 204 }),
        );
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });

    it('returns undefined for empty bodies', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        (global.fetch as jest.Mock).mockResolvedValue(
            new Response('', { status: 200 }),
        );
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });
});
