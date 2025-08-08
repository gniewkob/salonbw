import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useInvoices } from '@/hooks/useInvoices';

export default function InvoicesPage() {
    const { data, loading } = useInvoices();

    return (
        <RouteGuard>
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
