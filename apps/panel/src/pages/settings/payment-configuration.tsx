import RouteGuard from '@/components/RouteGuard';
import PaymentConfigurationPage from '@/components/settings/PaymentConfigurationPage';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentConfigurationRoute() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <PaymentConfigurationPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
