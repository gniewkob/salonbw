import RouteGuard from '@/components/RouteGuard';
import TimetableTemplatesPage from '@/components/settings/TimetableTemplatesPage';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableTemplatesRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <TimetableTemplatesPage />
            </VersumShell>
        </RouteGuard>
    );
}
