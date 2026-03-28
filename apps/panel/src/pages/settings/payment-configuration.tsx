import RouteGuard from '@/components/RouteGuard';
import PaymentConfigurationPage from '@/components/settings/PaymentConfigurationPage';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentConfigurationRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <PaymentConfigurationPage />
            </SalonShell>
        </RouteGuard>
    );
}
