import MockAdapter from 'axios-mock-adapter';
import { ApiClient } from '@/api/apiClient';

describe('ApiClient', () => {
    it('adds Authorization header when token is present', async () => {
        const client = new ApiClient(
            () => 't',
            () => {},
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mock = new MockAdapter((client as any).axios);
        mock.onGet('/test').reply((config) => {
            expect(config.headers?.Authorization).toBe('Bearer t');
            return [200, {}];
        });
        await client.request('/test');
    });

    it('calls logout callback on 401 responses', async () => {
        const onLogout = jest.fn();
        const client = new ApiClient(() => null, onLogout);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mock = new MockAdapter((client as any).axios);
        mock.onGet('/test').reply(401, { message: 'Unauthorized' });
        await expect(client.request('/test')).rejects.toThrow('Unauthorized');
        expect(onLogout).toHaveBeenCalled();
    });

    it('propagates error messages from the server', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mock = new MockAdapter((client as any).axios);
        const message = 'Bad things happened';
        mock.onGet('/test').reply(400, { message });
        await client.request('/test').catch((err) => {
            expect(err).toHaveProperty('message', message);
        });
    });

    it('returns undefined for 204 responses', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mock = new MockAdapter((client as any).axios);
        mock.onGet('/test').reply(204);
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });

    it('returns undefined for empty bodies', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mock = new MockAdapter((client as any).axios);
        mock.onGet('/test').reply(200, '');
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });
});
