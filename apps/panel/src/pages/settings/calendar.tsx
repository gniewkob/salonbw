import RouteGuard from '@/components/RouteGuard';
import CalendarSettingsForm from '@/components/settings/CalendarSettingsForm';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function CalendarSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <CalendarSettingsForm />
            </SalonShell>
        </RouteGuard>
    );
}
