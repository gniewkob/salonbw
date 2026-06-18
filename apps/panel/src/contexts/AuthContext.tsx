import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
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
    refreshProfile: () => Promise<void>;
    apiFetch: <T>(endpoint: string, init?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth tokens (`accessToken`, `refreshToken`) are managed exclusively by the
// backend as httpOnly cookies (see auth.service.ts:setAuthCookies). The panel
// must NOT write them from JS — doing so would overwrite the httpOnly version
// with a JS-readable one and downgrade security. ApiClient relies on
// `credentials: 'include'` so the browser attaches cookies automatically.

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
    // `sbw_auth` and `XSRF-TOKEN` are non-httpOnly markers set by the backend
    // alongside the httpOnly access/refresh tokens.
    return Boolean(Cookies.get('sbw_auth') || Cookies.get('XSRF-TOKEN'));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<Role | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);

    const clearClientAuthCookies = useCallback(() => {
        // Defensive only: the backend clears these on /auth/logout. We mirror
        // it locally so a stale React tree doesn't think it's still logged in
        // before the redirect lands.
        const opts = { path: '/' };
        Cookies.remove('accessToken', opts);
        Cookies.remove('refreshToken', opts);
        Cookies.remove('sbw_auth', opts);
        Cookies.remove('XSRF-TOKEN', opts);
    }, []);

    const clearSessionState = useCallback(() => {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        setCsrfToken(undefined);
        clearClientAuthCookies();
    }, [clearClientAuthCookies]);

    const handleLogout = useCallback(async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearSessionState();
            if (typeof window !== 'undefined') {
                const landingUrl =
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    'https://dev.salon-bw.pl';
                window.location.href = landingUrl;
            }
        }
    }, [clearSessionState]);

    useEffect(() => {
        setLogoutCallback(() => {
            void handleLogout();
        });
        // On unmount (or before a new effect run), reset the module-level
        // callback so a stale closure from an unmounted AuthProvider can't
        // call `setState` on this dead instance during fast-refresh or
        // tests that mount/unmount providers between cases.
        return () => {
            setLogoutCallback(() => {});
        };
    }, [handleLogout]);
    useEffect(() => {
        setCsrfToken(readCsrfCookie());
    }, []);

    const client = useMemo(() => {
        return new ApiClient(
            // Access token lives in an httpOnly cookie and is sent automatically
            // via `credentials: 'include'`. No JS-readable copy.
            () => null,
            () => {
                void handleLogout();
            },
            undefined,
            {
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
                headers: {
                    'x-skip-logout': 'true',
                    'Cache-Control': 'no-store',
                },
                cache: 'no-store',
            });
            setUser(u);
            setRole(u.role);
            setIsAuthenticated(true);
        } catch (error) {
            // Only treat real auth failures (401/403) as "not logged in".
            // Transient 5xx, 502, or network blips should NOT log the user
            // out — they just mean we couldn't reach the profile endpoint
            // this time. Keep existing session state so the next request
            // can recover.
            const status = (error as { status?: number } | null)?.status;
            const isAuthFailure = status === 401 || status === 403;
            if (isAuthFailure) {
                setIsAuthenticated(false);
                clearSessionState();
            }
        }
    }, [client, clearSessionState]);

    useEffect(() => {
        if (!hasAuthHint()) {
            setInitialized(true);
            return;
        }
        void fetchProfile().finally(() => setInitialized(true));
        // We only need to run the initial profile fetch once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email: string, password: string) => {
        // Backend issues httpOnly cookies (accessToken, refreshToken, XSRF-TOKEN,
        // sbw_auth) via Set-Cookie on /auth/login. We only need the CSRF token
        // from the non-httpOnly cookie and a profile fetch to populate React state.
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
        refreshProfile: fetchProfile,
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
