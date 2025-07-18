'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ApiClient } from '@/api/apiClient';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  apiFetch: <T>(endpoint: string, init?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'jwtToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) setToken(stored);
  }, []);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  };

  const client = useMemo(() => new ApiClient(() => token, handleLogout), [token]);

  const login = async (email: string, password: string) => {
    const data = await client.request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    localStorage.setItem(TOKEN_KEY, data.access_token);
  };

  const refreshToken = async () => {
    const data = await client.request<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
    });
    setToken(data.access_token);
    localStorage.setItem(TOKEN_KEY, data.access_token);
  };

  const value: AuthContextValue = {
    token,
    isAuthenticated: Boolean(token),
    login,
    logout: handleLogout,
    refreshToken,
    apiFetch: client.request.bind(client),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
