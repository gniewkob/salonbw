import RouteGuard from '@/components/RouteGuard';
import SmsSettingsPage from '@/components/settings/SmsSettingsPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function SmsSettingsRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <SmsSettingsPage />
            </SalonShell>
        </RouteGuard>
    );
}
