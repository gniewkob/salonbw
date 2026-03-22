import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import EventRemindersPage from '@/components/settings/EventRemindersPage';
import { useAuth } from '@/contexts/AuthContext';

export default function EventRemindersIndexPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <EventRemindersPage />
            </SalonBWShell>
        </RouteGuard>
    );
}
