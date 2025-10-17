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
