import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useInvoices, useMyInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';

export default function InvoicesPage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';

    // Admin sees all invoices, others see only their own
    const allInvoices = useInvoices({ enabled: Boolean(role) && isAdmin });
    const myInvoices = useMyInvoices({ enabled: Boolean(role) && !isAdmin });
    const { data, loading } = isAdmin ? allInvoices : myInvoices;

    if (!role) return null;

    return (
        <RouteGuard permission="nav:invoices">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="invoices-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Faktury' },
                        ]}
                    />

                    {loading ? (
                        <div className="salonbw-loading">Ładowanie...</div>
                    ) : (
                        <div className="salonbw-table-wrap">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Numer</th>
                                        <th>PDF</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.map((inv) => (
                                        <tr key={inv.id}>
                                            <td>{inv.number}</td>
                                            <td>
                                                <a
                                                    className="salonbw-link"
                                                    href={inv.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Pobierz
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
