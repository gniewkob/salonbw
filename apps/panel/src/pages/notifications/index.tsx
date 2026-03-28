import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';
import NotificationList from '@/components/NotificationList';

export default function NotificationsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard>
            <SalonShell role={role}>
                <NotificationList />
            </SalonShell>
        </RouteGuard>
    );
}
