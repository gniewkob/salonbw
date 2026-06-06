import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import OnlineBookingSettingsPage from '@/components/settings/OnlineBookingSettingsPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function OnlineBookingSettingsRoute() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Rezerwacje online — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <OnlineBookingSettingsPage />
            </SalonShell>
        </RouteGuard>
    );
}
