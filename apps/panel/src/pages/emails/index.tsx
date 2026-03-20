import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';
import EmailList from '@/components/EmailList';

export default function EmailsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard permission="nav:emails">
            <SalonBWShell role={role}>
                <EmailList />
            </SalonBWShell>
        </RouteGuard>
    );
}
