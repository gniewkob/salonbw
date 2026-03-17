import RouteGuard from '@/components/RouteGuard';
import NewCustomerGroupPage from '@/components/settings/NewCustomerGroupPage';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCustomerGroupSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <NewCustomerGroupPage />
            </VersumShell>
        </RouteGuard>
    );
}
