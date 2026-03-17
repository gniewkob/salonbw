import RouteGuard from '@/components/RouteGuard';
import TimetableEmployeesPage from '@/components/settings/TimetableEmployeesPage';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableEmployeesRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <TimetableEmployeesPage />
            </VersumShell>
        </RouteGuard>
    );
}
