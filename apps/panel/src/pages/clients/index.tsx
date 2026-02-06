import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import ClientsSidebar from '@/components/clients/ClientsSidebar';
import ClientsList from '@/components/clients/ClientsList';
import { useCustomers } from '@/hooks/useCustomers'; // Assuming hook exists

export default function ClientsPage() {
    // We fetch data here using standard user hooks
    const { data: customers = [], loading } = useCustomers();

    return (
        <RouteGuard
            roles={['client', 'employee', 'receptionist', 'admin']}
            permission="nav:customers"
        >
            <DashboardLayout secondaryNav={<ClientsSidebar />}>
                <div className="h-[calc(100vh-64px)] overflow-hidden">
                    <ClientsList customers={customers} loading={loading} />
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
