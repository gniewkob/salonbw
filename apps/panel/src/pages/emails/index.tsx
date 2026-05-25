import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';
import EmailList from '@/components/EmailList';

export default function EmailsPage() {
    const { role } = useAuth();


    return (
        <RouteGuard permission="nav:emails">
            <SalonShell role={role}>
                <EmailList />
            </SalonShell>
        </RouteGuard>
    );
}
