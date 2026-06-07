import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import CalendarSettingsForm from '@/components/settings/CalendarSettingsForm';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function CalendarSettingsPage() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Ustawienia kalendarza — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <CalendarSettingsForm />
            </SalonShell>
        </RouteGuard>
    );
}
