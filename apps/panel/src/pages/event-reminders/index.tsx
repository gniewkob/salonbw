import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import EventRemindersPage from '@/components/settings/EventRemindersPage';
import { useAuth } from '@/contexts/AuthContext';

export default function EventRemindersIndexPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <EventRemindersPage />
            </SalonShell>
        </RouteGuard>
    );
}
