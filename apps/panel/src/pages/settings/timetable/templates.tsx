import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import TimetableTemplatesPage from '@/components/settings/TimetableTemplatesPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableTemplatesRoute() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Szablony harmonogramu — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <TimetableTemplatesPage />
            </SalonShell>
        </RouteGuard>
    );
}
