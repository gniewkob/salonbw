import RouteGuard from '@/components/RouteGuard';
import HelpContactPage from '@/components/help/HelpContactPage';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function HelpContactRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard>
            <VersumShell role={role}>
                <HelpContactPage />
            </VersumShell>
        </RouteGuard>
    );
}
