import { ApiClient } from '@/api/apiClient';

describe('ApiClient', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        if (originalFetch) {
            global.fetch = originalFetch;
        }
        jest.resetAllMocks();
    });

    it('adds Authorization header when token is present', async () => {
        const token = 'test-token';
        const client = new ApiClient(
            () => token,
            () => {},
        );
        global.fetch = jest
            .fn()
            .mockResolvedValue(
                new Response('{}', { status: 200 }),
            ) as jest.MockedFunction<typeof fetch>;

        await client.request('/test');

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        const headers = options.headers as Headers;
        expect(headers.get('Authorization')).toBe(`Bearer ${token}`);
    });

    it.each([401, 403])(
        'calls logout callback on %i responses',
        async (status) => {
            const onLogout = jest.fn();
            const client = new ApiClient(() => null, onLogout);
            global.fetch = jest
                .fn()
                .mockResolvedValue(
                    new Response(null, { status, statusText: 'Unauthorized' }),
                ) as jest.MockedFunction<typeof fetch>;

            await expect(client.request('/test')).rejects.toThrow(
                'Unauthorized',
            );
            expect(onLogout).toHaveBeenCalled();
        },
    );

    it('propagates error messages from the server', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        const message = 'Bad things happened';
        global.fetch = jest.fn().mockResolvedValue(
            new Response(JSON.stringify({ message }), {
                status: 400,
                statusText: 'Bad Request',
                headers: { 'Content-Type': 'application/json' },
            }),
        ) as jest.MockedFunction<typeof fetch>;

        await expect(client.request('/test')).rejects.toMatchObject({
            message,
            status: 400,
        });
    });

    it('returns undefined for 204 responses', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        global.fetch = jest
            .fn()
            .mockResolvedValue(
                new Response(null, { status: 204, statusText: 'No Content' }),
            ) as jest.MockedFunction<typeof fetch>;
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });

    it('returns undefined for empty bodies', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        global.fetch = jest
            .fn()
            .mockResolvedValue(
                new Response('', { status: 200 }),
            ) as jest.MockedFunction<typeof fetch>;
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });
});
