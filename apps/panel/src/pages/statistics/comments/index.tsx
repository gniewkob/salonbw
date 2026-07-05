import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

// The old Booksy/Moment "integration required" placeholder was a Versum-clone
// leftover — meaningless now that the salon runs native star reviews and is
// leaving Booksy entirely. Redirect to the native opinions manager (/reviews).
export default function CommentsStatisticsRedirect() {
    const router = useRouter();
    const { role } = useAuth();

    useEffect(() => {
        void router.replace('/reviews');
    }, [router]);

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <Head>
                <title>Opinie — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <p className="text-muted" role="status">
                        Przekierowanie do opinii klientów…
                    </p>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
