import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import EmailList from '@/components/EmailList';

export default function EmailsPage() {
    return (
        <RouteGuard>
            <DashboardLayout>
                <EmailList />
            </DashboardLayout>
        </RouteGuard>
    );
}
