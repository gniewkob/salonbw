import RouteGuard from '@/components/RouteGuard';
import CalendarSettingsForm from '@/components/settings/CalendarSettingsForm';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function CalendarSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <CalendarSettingsForm />
            </VersumShell>
        </RouteGuard>
    );
}
