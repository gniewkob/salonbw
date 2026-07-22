import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { ApiClient } from '@/api/apiClient';
import {
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
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

// Auth tokens (`accessToken`, `refreshToken`) are managed exclusively by the
// backend as httpOnly cookies. The landing app must not mirror them into
// localStorage or js-cookie; that would make the session JS-readable and could
// overwrite the secure httpOnly cookie.
const clearLegacyTokenStorage = () => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.removeItem('jwtToken');
        window.localStorage.removeItem('refreshToken');
    } catch {
        // Ignore storage failures in private mode or restricted browsers.
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

const hasAuthHint = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    return Boolean(Cookies.get('sbw_auth') || Cookies.get('XSRF-TOKEN'));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [role, setRole] = useState<Role | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
    const clearClientAuthCookies = useCallback(() => {
        const cookieOptionSets = window.location.hostname.includes(
            'salon-bw.pl',
        )
            ? [{ path: '/' }, { domain: '.salon-bw.pl', path: '/' }]
            : [{ path: '/' }];

        for (const options of cookieOptionSets) {
            Cookies.remove('accessToken', options);
            Cookies.remove('refreshToken', options);
            Cookies.remove('sbw_auth', options);
            Cookies.remove('XSRF-TOKEN', options);
            Cookies.remove('token', options);
        }
    }, []);

    const clearSessionState = useCallback(() => {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        setCsrfToken(undefined);
        clearLegacyTokenStorage();
        clearClientAuthCookies();
    }, [clearClientAuthCookies]);

    const handleLogout = useCallback(async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearSessionState();
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
            () => {
                return null;
            },
            () => {
                void handleLogout();
            },
            undefined,
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
    }, [csrfToken, handleLogout]);

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
        clearLegacyTokenStorage();
        if (!hasAuthHint()) {
            setInitialized(true);
            return;
        }
        void fetchProfile().finally(() => setInitialized(true));
        // We only need to run the initial profile fetch once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email: string, password: string) => {
        await apiLogin({ email, password });
        setCsrfToken(readCsrfCookie());
        await fetchProfile();
    };

    const register = async (data: RegisterData) => {
        await apiRegister(data);
        await login(data.email, data.password);
    };

    const refresh = async () => {
        try {
            await apiRefreshToken();
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
