import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import NotificationList from '@/components/NotificationList';

export default function NotificationsPage() {
  return (
    <RouteGuard>
      <Layout>
        <NotificationList />
      </Layout>
    </RouteGuard>
  );
}
