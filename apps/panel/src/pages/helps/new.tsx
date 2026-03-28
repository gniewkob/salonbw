import RouteGuard from '@/components/RouteGuard';
import HelpContactPage from '@/components/help/HelpContactPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function HelpContactRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard>
            <SalonShell role={role}>
                <HelpContactPage />
            </SalonShell>
        </RouteGuard>
    );
}
