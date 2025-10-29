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
import { ApiClient } from '@/api/apiClient';
import {
    login as apiLogin,
    register as apiRegister,
    refreshToken as apiRefreshToken,
    REFRESH_TOKEN_KEY,
    setLogoutCallback,
    type AuthTokens,
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

// No longer need these keys as we're using cookies
const XSRF_HEADER = 'X-XSRF-TOKEN';
const XSRF_COOKIE = 'XSRF-TOKEN';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const decodeRole = useCallback((jwt: string): Role | null => {
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]));
            const r = payload.role as Role | undefined;
            if (
                r === 'client' ||
                r === 'employee' ||
                r === 'receptionist' ||
                r === 'admin'
            ) {
                return r;
            }
            return null;
        } catch {
            return null;
        }
    }, []);

    // Removed token states since we're using httpOnly cookies
    // Role is now set only based on the current logged in user
    const [role, setRole] = useState<Role | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            setRole(null);
            setIsAuthenticated(false);
            void router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [router]);

    useEffect(() => {
        setLogoutCallback(handleLogout);
    }, [handleLogout]);

    // Initialize the client with CSRF handling
    const client = useMemo(() => {
        const csrfToken = document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

        return new ApiClient(
            // No longer passing access token as it's handled by cookies
            () => null,
            handleLogout,
            undefined, // No token refresh handler needed
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
    }, [handleLogout]);

    const fetchProfile = useCallback(async () => {
        try {
            const u = await client.request<User>('/api/users/profile');
            setUser(u);
            setRole(u.role);
            setIsAuthenticated(true);
        } catch (err) {
            setIsAuthenticated(false);
            void handleLogout();
        }
    }, [client, handleLogout]);

    useEffect(() => {
        void fetchProfile().finally(() => setInitialized(true));
    }, [fetchProfile]);

    const login = async (email: string, password: string) => {
        await apiLogin({ email, password });
        await fetchProfile();
    };

    const register = async (data: RegisterData) => {
        await apiRegister(data);
        await login(data.email, data.password);
    };

    const refresh = async () => {
        try {
            await apiRefreshToken();
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
