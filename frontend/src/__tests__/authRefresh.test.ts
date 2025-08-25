import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiClient } from '@/api/apiClient';

interface MockAxiosInstance extends AxiosInstance {
    __requestHandlers: ((config: AxiosRequestConfig) => AxiosRequestConfig)[];
    __responseError: ((error: unknown) => unknown) | null;
    __impl: (
        config: AxiosRequestConfig,
        respErr: ((error: unknown) => unknown) | null,
    ) => Promise<unknown>;
    post: jest.Mock;
}

jest.mock('axios', () => {
    const instance = ((config: AxiosRequestConfig) =>
        instance.request(config)) as unknown as MockAxiosInstance;
    instance.__requestHandlers = [];
    instance.__responseError = null;
    instance.interceptors = {
        request: {
            use: (fn: (config: AxiosRequestConfig) => AxiosRequestConfig) =>
                instance.__requestHandlers.push(fn),
        },
        response: {
            use: (_: unknown, err: (error: unknown) => unknown) => {
                instance.__responseError = err;
            },
        },
    };
    instance.request = jest.fn(async (config: AxiosRequestConfig) => {
        for (const fn of instance.__requestHandlers) {
            config = fn(config);
        }
        return instance.__impl(config, instance.__responseError);
    });
    instance.post = jest.fn();
    interface AxiosMock {
        create: jest.Mock<MockAxiosInstance, []>;
        __instance: MockAxiosInstance;
    }
    const axiosMock: AxiosMock = {
        create: jest.fn(() => instance),
        __instance: instance,
    };
    return axiosMock;
});

const mockedAxios = axios as unknown as { __instance: MockAxiosInstance };

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
        instance.__impl = async (
            config: AxiosRequestConfig,
            respErr: ((error: unknown) => unknown) | null,
        ) => {
            authHeaders.push(config.headers?.Authorization as string);
            if (call++ === 0) {
                const error = { response: { status: 401 }, config };
                return respErr!(error);
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
