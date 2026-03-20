import RouteGuard from '@/components/RouteGuard';
import TimetableEmployeesPage from '@/components/settings/TimetableEmployeesPage';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetableEmployeesRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <TimetableEmployeesPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
