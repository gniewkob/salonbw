import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import PaymentConfigurationPage from '@/components/settings/PaymentConfigurationPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentConfigurationRoute() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Płatności — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <PaymentConfigurationPage />
            </SalonShell>
        </RouteGuard>
    );
}
