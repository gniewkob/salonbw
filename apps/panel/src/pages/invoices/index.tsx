import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useInvoices, useMyInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';

export default function InvoicesPage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';

    // Admin sees all invoices, others see only their own
    const allInvoices = useInvoices({ enabled: isAdmin });
    const myInvoices = useMyInvoices({ enabled: !isAdmin });
    const { data, loading } = isAdmin ? allInvoices : myInvoices;

    return (
        <RouteGuard permission="nav:invoices">
            <DashboardLayout>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <table className="min-w-full border">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-2 text-left">Number</th>
                                <th className="p-2 text-left">PDF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.map((inv) => (
                                <tr key={inv.id} className="border-t">
                                    <td className="p-2">{inv.number}</td>
                                    <td className="p-2">
                                        <a
                                            className="underline"
                                            href={inv.pdfUrl}
                                            target="_blank"
                                        >
                                            Pobierz
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </DashboardLayout>
        </RouteGuard>
    );
}
