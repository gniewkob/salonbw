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
    accessToken: string | null;
    refreshToken: string | null;
    role: Role | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refresh: () => Promise<void>;
    apiFetch: <T>(endpoint: string, init?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'jwtToken';
const ROLE_KEY = 'role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<Role | null>(null);

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

    useEffect(() => {
        const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        const storedRole = localStorage.getItem(ROLE_KEY) as Role | null;
        if (storedAccess) {
            setAccessToken(storedAccess);
            const r = decodeRole(storedAccess);
            setRole(r);
        }
        if (storedRefresh) setRefreshToken(storedRefresh);
        if (
            storedRole === 'client' ||
            storedRole === 'employee' ||
            storedRole === 'receptionist' ||
            storedRole === 'admin'
        ) {
            setRole(storedRole);
        }
    }, [decodeRole]);

    const handleLogout = useCallback(() => {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setRole(null);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        void router.push('/auth/login');
    }, [router]);

    useEffect(() => {
        setLogoutCallback(handleLogout);
    }, [handleLogout]);

    const applyTokens = useCallback(
        (data: AuthTokens) => {
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            const r = decodeRole(data.accessToken);
            setRole(r);
            if (r) localStorage.setItem(ROLE_KEY, r);
        },
        [decodeRole],
    );

    const client = useMemo(
        () => new ApiClient(() => accessToken, handleLogout, applyTokens),
        [accessToken, handleLogout, applyTokens],
    );

    const fetchProfile = useCallback(async () => {
        const u = await client.request<User>('/profile');
        setUser(u);
        setRole(u.role);
    }, [client]);

    useEffect(() => {
        if (accessToken) {
            void fetchProfile().catch(handleLogout);
        }
    }, [accessToken, fetchProfile, handleLogout]);

    const login = async (email: string, password: string) => {
        const data = await apiLogin({ email, password });
        applyTokens(data);
    };

    const register = async (data: RegisterData) => {
        await apiRegister(data);
        await login(data.email, data.password);
    };

    const refresh = async () => {
        try {
            const data = await apiRefreshToken();
            applyTokens(data);
        } catch (err) {
            handleLogout();
            throw err;
        }
    };

    const value: AuthContextValue = {
        user,
        accessToken,
        refreshToken,
        role,
        isAuthenticated: Boolean(accessToken),
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
