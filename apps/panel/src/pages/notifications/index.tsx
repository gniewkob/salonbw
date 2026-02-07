import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import NotificationList from '@/components/NotificationList';

export default function NotificationsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard>
            <VersumShell role={role}>
                <NotificationList />
            </VersumShell>
        </RouteGuard>
    );
}
