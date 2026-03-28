import RouteGuard from '@/components/RouteGuard';
import NewCustomerGroupPage from '@/components/settings/NewCustomerGroupPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCustomerGroupSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <NewCustomerGroupPage />
            </SalonShell>
        </RouteGuard>
    );
}
