import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import CustomerGroupsListPage from '@/components/settings/CustomerGroupsListPage';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerGroupsSettingsPage() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Grupy klientów — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <CustomerGroupsListPage />
            </SalonShell>
        </RouteGuard>
    );
}
