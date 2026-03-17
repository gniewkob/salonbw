import RouteGuard from '@/components/RouteGuard';
import PaymentConfigurationPage from '@/components/settings/PaymentConfigurationPage';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentConfigurationRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <PaymentConfigurationPage />
            </VersumShell>
        </RouteGuard>
    );
}
