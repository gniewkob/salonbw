import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import TimetableEmployeesPage from '@/components/settings/TimetableEmployeesPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableEmployeesRoute() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Harmonogram pracowników — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <TimetableEmployeesPage />
            </SalonShell>
        </RouteGuard>
    );
}
