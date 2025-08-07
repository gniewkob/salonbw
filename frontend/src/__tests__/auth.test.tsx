import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const server = setupServer(
  http.post('http://localhost/auth/login', () =>
    HttpResponse.json({ access_token: 'abc' })
  ),
  http.get('http://localhost/clients', () =>
    HttpResponse.json([{ id: 1, name: 'John' }])
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('auth flow', () => {
  it('login fetches token and fetches clients then logout clears token', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, null, children);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('a', 'b');
    });
    expect(result.current.token).toBe('abc');

    await act(async () => {
      const clients = await result.current.apiFetch<{ id: number; name: string }[]>(
        '/clients'
      );
      expect(clients[0].name).toBe('John');
    });

    act(() => {
      result.current.logout();
    });
    expect(result.current.token).toBeNull();
  });
});
