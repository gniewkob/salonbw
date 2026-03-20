import RouteGuard from '@/components/RouteGuard';
import HelpContactPage from '@/components/help/HelpContactPage';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function HelpContactRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard>
            <SalonBWShell role={role}>
                <HelpContactPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
