import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';

export default function Home() {
    const router = useRouter();
    const { initialized, isAuthenticated, role } = useAuth();

    useEffect(() => {
        if (!initialized) return;

        if (!isAuthenticated) {
            void router.replace('/auth/login');
            return;
        }

        void router.replace(getPostLoginRoute(role));
    }, [initialized, isAuthenticated, role, router]);

    return null;
}
