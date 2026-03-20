import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';
import NotificationList from '@/components/NotificationList';

export default function NotificationsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard>
            <SalonBWShell role={role}>
                <NotificationList />
            </SalonBWShell>
        </RouteGuard>
    );
}
