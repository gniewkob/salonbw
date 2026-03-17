import RouteGuard from '@/components/RouteGuard';
import CustomerGroupsListPage from '@/components/settings/CustomerGroupsListPage';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerGroupsSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <CustomerGroupsListPage />
            </VersumShell>
        </RouteGuard>
    );
}
