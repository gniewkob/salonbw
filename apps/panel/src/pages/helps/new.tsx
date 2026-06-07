import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import HelpContactPage from '@/components/help/HelpContactPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function HelpContactRoute() {
    const { role } = useAuth();

    return (
        <RouteGuard>
            <Head>
                <title>Kontakt i pomoc — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <HelpContactPage />
            </SalonShell>
        </RouteGuard>
    );
}
