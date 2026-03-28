import RouteGuard from '@/components/RouteGuard';
import CustomerGroupsListPage from '@/components/settings/CustomerGroupsListPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerGroupsSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <CustomerGroupsListPage />
            </SalonShell>
        </RouteGuard>
    );
}
