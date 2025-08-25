import axios, { AxiosRequestConfig } from 'axios';
import { ApiClient } from '@/api/apiClient';

jest.mock('axios', () => {
    const instance: any = (config: any) => instance.request(config);
    instance.__requestHandlers = [];
    instance.__responseError = null;
    instance.interceptors = {
        request: { use: (fn: any) => instance.__requestHandlers.push(fn) },
        response: { use: (_: any, err: any) => (instance.__responseError = err) },
    };
    instance.request = jest.fn(async (config: any) => {
        for (const fn of instance.__requestHandlers) {
            config = fn(config);
        }
        return instance.__impl(config, instance.__responseError);
    });
    instance.post = jest.fn();
    const axiosMock: any = { create: jest.fn(() => instance), __instance: instance };
    return axiosMock;
});

const mockedAxios = axios as any;

beforeEach(() => {
    localStorage.clear();
    const instance = mockedAxios.__instance;
    instance.__requestHandlers = [];
    instance.__responseError = null;
    instance.request.mockClear();
    instance.post.mockClear();
});

describe('ApiClient token refresh', () => {
    it('retries request with refreshed token on 401', async () => {
        const instance = mockedAxios.__instance;
        let call = 0;
        const authHeaders: string[] = [];
        instance.__impl = async (config: AxiosRequestConfig, respErr: any) => {
            authHeaders.push(config.headers?.Authorization as string);
            if (call++ === 0) {
                const error = { response: { status: 401 }, config };
                return respErr(error);
            }
            return { status: 200, data: { ok: true } };
        };
        instance.post.mockResolvedValueOnce({
            data: { accessToken: 'new', refreshToken: 'ref' },
        });

        localStorage.setItem('refreshToken', 'old');
        let token = 'oldToken';
        const client = new ApiClient(
            () => token,
            jest.fn(),
            (t) => {
                token = t.accessToken;
                localStorage.setItem('refreshToken', t.refreshToken);
            },
        );

        const res = await client.request<{ ok: boolean }>('/protected');
        expect(res).toEqual({ ok: true });
        expect(authHeaders).toEqual(['Bearer oldToken', 'Bearer new']);
        expect(localStorage.getItem('refreshToken')).toBe('ref');
    });
});
