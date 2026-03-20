import RouteGuard from '@/components/RouteGuard';
import SmsSettingsPage from '@/components/settings/SmsSettingsPage';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function SmsSettingsRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <SmsSettingsPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
