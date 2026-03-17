import RouteGuard from '@/components/RouteGuard';
import SmsSettingsPage from '@/components/settings/SmsSettingsPage';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function SmsSettingsRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <SmsSettingsPage />
            </VersumShell>
        </RouteGuard>
    );
}
