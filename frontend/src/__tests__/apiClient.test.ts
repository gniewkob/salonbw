import { ApiClient } from '@/api/apiClient';

describe('ApiClient', () => {
  const client = new ApiClient(() => null, () => {});
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    jest.resetAllMocks();
  });

  it('returns undefined for 204 responses', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(null, { status: 204, statusText: 'No Content' })
    ) as jest.MockedFunction<typeof fetch>;
    const res = await client.request('/test');
    expect(res).toBeUndefined();
  });

  it('returns undefined for empty bodies', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response('', { status: 200 })
    ) as jest.MockedFunction<typeof fetch>;
    const res = await client.request('/test');
    expect(res).toBeUndefined();
  });
});
