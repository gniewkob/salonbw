export interface ApiError extends Error {
  status?: number;
}

export class ApiClient {
  constructor(
    private getToken: () => string | null,
    private onLogout: () => void
  ) {}

  async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const headers = new Headers(init.headers);
    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const retries = 3;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...init,
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            this.onLogout();
          }
          let message: string;
          try {
            const data = await response.json();
            message = data.message || response.statusText;
          } catch {
            message = response.statusText;
          }
          const error: ApiError = new Error(message);
          error.status = response.status;
          throw error;
        }
        if (response.status === 204) {
          return undefined as T;
        }
        const text = await response.text();
        if (!text) {
          return undefined as T;
        }
        return JSON.parse(text) as T;
      } catch (error: unknown) {
        const err = error as ApiError & { response?: { data?: unknown } };
        console.error('API request failed', err.response?.data || err.message);
        if (
          attempt === retries - 1 ||
          (typeof err.status === 'number' && err.status < 500)
        ) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
    throw new Error('Request failed');
  }
}
