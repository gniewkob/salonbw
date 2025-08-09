import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import NotificationList from '@/components/NotificationList';

export default function NotificationsPage() {
  return (
    <RouteGuard>
      <DashboardLayout>
        <NotificationList />
      </DashboardLayout>
    </RouteGuard>
  );
}
