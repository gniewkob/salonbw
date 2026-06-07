import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SmsSettingsPage from '@/components/settings/SmsSettingsPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function SmsSettingsRoute() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Ustawienia SMS — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <SmsSettingsPage />
            </SalonShell>
        </RouteGuard>
    );
}
