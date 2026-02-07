import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import EmailList from '@/components/EmailList';

export default function EmailsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard permission="nav:emails">
            <VersumShell role={role}>
                <EmailList />
            </VersumShell>
        </RouteGuard>
    );
}
