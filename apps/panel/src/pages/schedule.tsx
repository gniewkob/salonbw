import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Self-service entry: redirects the logged-in user to their own timetable
 * editor. Employees reach this from the topbar user menu ("Mój grafik");
 * the timetable page enforces own-only access for employees.
 */
export default function MySchedulePage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            void router.replace(`/settings/timetable/employees/${user.id}`);
        }
    }, [user?.id, router]);

    return (
        <RouteGuard roles={['admin', 'employee']}>
            <Head>
                <title>Mój grafik | Salon Black &amp; White</title>
            </Head>
            <p style={{ padding: '2rem', color: '#6c757d' }}>
                Wczytywanie grafiku…
            </p>
        </RouteGuard>
    );
}
