import RouteGuard from '@/components/RouteGuard';
import TimetableTemplatesPage from '@/components/settings/TimetableTemplatesPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableTemplatesRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <TimetableTemplatesPage />
            </SalonShell>
        </RouteGuard>
    );
}
