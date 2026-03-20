import RouteGuard from '@/components/RouteGuard';
import TimetableTemplatesPage from '@/components/settings/TimetableTemplatesPage';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableTemplatesRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <TimetableTemplatesPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
