import RouteGuard from '@/components/RouteGuard';
import NewCustomerGroupPage from '@/components/settings/NewCustomerGroupPage';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCustomerGroupSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <NewCustomerGroupPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
