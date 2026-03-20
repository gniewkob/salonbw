import RouteGuard from '@/components/RouteGuard';
import CustomerGroupsListPage from '@/components/settings/CustomerGroupsListPage';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerGroupsSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <CustomerGroupsListPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
