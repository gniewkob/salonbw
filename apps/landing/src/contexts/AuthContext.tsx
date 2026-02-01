'use client';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useRouter } from 'next/router';
import { ApiClient, type AuthTokens } from '@/api/apiClient';
import {
    login as apiLogin,
    register as apiRegister,
    refreshToken as apiRefreshToken,
    setLogoutCallback,
    type RegisterData,
} from '@/api/auth';
import type { Role, User } from '@/types';

interface AuthContextValue {
    user: User | null;
    role: Role | null;
    initialized: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    apiFetch: <T>(endpoint: string, init?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'jwtToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const readLocalStorageValue = (key: string): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

const writeLocalStorageValue = (key: string, value: string | null) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        if (value === null) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, value);
        }
    } catch {
        // ignore storage failures (private mode, etc.)
    }
};

const readCsrfCookie = () => {
    if (typeof document === 'undefined') {
        return undefined;
    }
    return document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [role, setRole] = useState<Role | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
    const persistTokens = useCallback((nextTokens: AuthTokens | null) => {
        writeLocalStorageValue(
            ACCESS_TOKEN_KEY,
            nextTokens?.accessToken ?? null,
        );
        writeLocalStorageValue(
            REFRESH_TOKEN_KEY,
            nextTokens?.refreshToken ?? null,
        );
    }, []);

    const clearSessionState = useCallback(() => {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        setCsrfToken(undefined);
        persistTokens(null);
    }, [persistTokens]);

    const handleLogout = useCallback(async () => {
        clearSessionState();
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
        } finally {
            void router.push('/');
            if (typeof window !== 'undefined') {
                // Force reload to clear any in-memory states if needed
                // window.location.href = '/';
            }
        }
    }, [clearSessionState, router]);

    useEffect(() => {
        setLogoutCallback(() => {
            void handleLogout();
        });
    }, [handleLogout]);
    useEffect(() => {
        setCsrfToken(readCsrfCookie());
    }, []);

    const client = useMemo(() => {
        return new ApiClient(
            () => readLocalStorageValue(ACCESS_TOKEN_KEY),
            () => {
                void handleLogout();
            },
            (nextTokens) => {
                persistTokens(nextTokens);
            },
            {
                // Explicitly pass baseUrl from app code (where Next.js replaces env vars)
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                // Add CSRF token to requests
                requestInit: csrfToken
                    ? {
                          headers: {
                              'X-XSRF-TOKEN': csrfToken,
                          },
                      }
                    : undefined,
            },
        );
    }, [csrfToken, handleLogout, persistTokens]);

    const fetchProfile = useCallback(async () => {
        try {
            const u = await client.request<User>('/users/profile', {
                headers: { 'x-skip-logout': 'true' },
            });
            setUser(u);
            setRole(u.role);
            setIsAuthenticated(true);
        } catch {
            setIsAuthenticated(false);
            clearSessionState();
        }
    }, [client, clearSessionState]);

    useEffect(() => {
        void fetchProfile().finally(() => setInitialized(true));
        // We only need to run the initial profile fetch once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email: string, password: string) => {
        const authTokens = await apiLogin({ email, password });
        persistTokens(authTokens);
        setCsrfToken(readCsrfCookie());
        await fetchProfile();
    };

    const register = async (data: RegisterData) => {
        await apiRegister(data);
        await login(data.email, data.password);
    };

    const refresh = async () => {
        try {
            const authTokens = await apiRefreshToken();
            persistTokens(authTokens);
            setCsrfToken(readCsrfCookie());
            await fetchProfile();
        } catch (err) {
            void handleLogout();
            throw err;
        }
    };

    const value: AuthContextValue = {
        user,
        role,
        initialized,
        isAuthenticated,
        login,
        register,
        logout: handleLogout,
        refresh,
        apiFetch: client.request.bind(client),
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
