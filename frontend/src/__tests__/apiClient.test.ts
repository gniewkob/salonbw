import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { ApiClient } from '@/api/apiClient';

const axiosInstance = (client: ApiClient): AxiosInstance =>
    (client as unknown as { axios: AxiosInstance }).axios;

describe('ApiClient', () => {
    it('adds Authorization header when token is present', async () => {
        const client = new ApiClient(
            () => 't',
            () => {},
        );
        const mock = new MockAdapter(axiosInstance(client));
        mock.onGet('/test').reply((config) => {
            expect(config.headers?.Authorization).toBe('Bearer t');
            return [200, {}];
        });
        await client.request('/test');
    });

    it('calls logout callback on 401 responses', async () => {
        const onLogout = jest.fn();
        const client = new ApiClient(() => null, onLogout);
        const mock = new MockAdapter(axiosInstance(client));
        mock.onGet('/test').reply(401, { message: 'Unauthorized' });
        await expect(client.request('/test')).rejects.toThrow('Unauthorized');
        expect(onLogout).toHaveBeenCalled();
    });

    it('propagates error messages from the server', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        const mock = new MockAdapter(axiosInstance(client));
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
        const mock = new MockAdapter(axiosInstance(client));
        mock.onGet('/test').reply(204);
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });

    it('returns undefined for empty bodies', async () => {
        const client = new ApiClient(
            () => null,
            () => {},
        );
        const mock = new MockAdapter(axiosInstance(client));
        mock.onGet('/test').reply(200, '');
        const res = await client.request('/test');
        expect(res).toBeUndefined();
    });
});
