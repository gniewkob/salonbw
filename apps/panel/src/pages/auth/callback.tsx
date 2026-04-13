'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import Cookies from 'js-cookie';
import type { User } from '@/types';

export default function AuthCallbackPage() {
    const { apiFetch, refresh } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            // Backend should have set the cookies (accessToken, refreshToken, sbw_auth)
            const isAuthenticated = Cookies.get('sbw_auth') === 'true';

            if (!isAuthenticated) {
                void router.push('/auth/login?error=social_auth_failed');
                return;
            }

            try {
                // Fetch profile to verify authentication and get role
                const profile = await apiFetch<User>('/users/profile');
                const target = getPostLoginRoute(profile?.role);
                void router.push(target);
            } catch (error) {
                console.error('Social auth profile fetch error:', error);
                void router.push('/auth/login?error=profile_fetch_failed');
            }
        };

        void handleCallback();
    }, [apiFetch, router]);

    return (
        <div className="d-flex flex-column align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
            <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Trwa logowanie...</span>
            </div>
            <p className="text-muted">Finalizowanie autoryzacji...</p>
        </div>
    );
}
