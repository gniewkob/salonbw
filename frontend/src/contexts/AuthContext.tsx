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
import { login as apiLogin, refreshToken as apiRefreshToken, REFRESH_TOKEN_KEY } from '@/api/auth';
import type { Role } from '@/types';

interface AuthContextValue {
    token: string | null;
    role: Role | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    apiFetch: <T>(endpoint: string, init?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'jwtToken';
const ROLE_KEY = 'role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<Role | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedRole = localStorage.getItem(ROLE_KEY) as Role | null;
        if (storedToken) setToken(storedToken);
        if (
            storedRole === 'client' ||
            storedRole === 'employee' ||
            storedRole === 'receptionist' ||
            storedRole === 'admin'
        ) {
            setRole(storedRole);
        }
    }, []);

    const handleLogout = useCallback(() => {
        setToken(null);
        setRole(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        void router.push('/auth/login');
    }, [router]);

    const client = useMemo(
        () => new ApiClient(() => token, handleLogout),
        [token, handleLogout],
    );

    const decodeRole = (jwt: string): Role | null => {
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
    };

    const login = async (email: string, password: string) => {
        const data = await apiLogin({ email, password });
        setToken(data.accessToken);
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        const r = decodeRole(data.accessToken);
        setRole(r);
        if (r) localStorage.setItem(ROLE_KEY, r);
    };

    const refreshToken = async () => {
        const data = await apiRefreshToken();
        setToken(data.accessToken);
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        const r = decodeRole(data.accessToken);
        setRole(r);
        if (r) localStorage.setItem(ROLE_KEY, r);
    };

    const value: AuthContextValue = {
        token,
        role,
        isAuthenticated: Boolean(token),
        login,
        logout: handleLogout,
        refreshToken,
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
