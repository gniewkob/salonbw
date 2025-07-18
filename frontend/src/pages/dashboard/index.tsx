import RouteGuard from '@/components/RouteGuard';

export default function DashboardPage() {
  return (
    <RouteGuard>
      <div>Dashboard</div>
    </RouteGuard>
  );
}
