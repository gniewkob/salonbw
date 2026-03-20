import RouteGuard from '@/components/RouteGuard';
import CalendarSettingsForm from '@/components/settings/CalendarSettingsForm';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function CalendarSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <CalendarSettingsForm />
            </SalonBWShell>
        </RouteGuard>
    );
}
