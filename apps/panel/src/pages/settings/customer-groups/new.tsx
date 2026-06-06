import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import NewCustomerGroupPage from '@/components/settings/NewCustomerGroupPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCustomerGroupSettingsPage() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Nowa grupa klientów — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <NewCustomerGroupPage />
            </SalonShell>
        </RouteGuard>
    );
}
