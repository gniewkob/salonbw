import RouteGuard from '@/components/RouteGuard';
import TimetableEmployeesPage from '@/components/settings/TimetableEmployeesPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableEmployeesRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <TimetableEmployeesPage />
            </SalonShell>
        </RouteGuard>
    );
}
