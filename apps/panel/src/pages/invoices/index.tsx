import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoices, useMyInvoices } from '@/hooks/useInvoices';

const STATUS_LABELS: Record<string, string> = {
    issued: 'Wystawiona',
    paid: 'Opłacona',
    overdue: 'Zaległa',
    cancelled: 'Anulowana',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export default function InvoicesPage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';

    const allInvoices = useInvoices({ enabled: Boolean(role) && isAdmin });
    const myInvoices = useMyInvoices({ enabled: Boolean(role) && !isAdmin });
    const { data, loading } = isAdmin ? allInvoices : myInvoices;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="invoices-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Faktury i abonament' },
                        ]}
                    />

                    <div className="mb-3">
                        <h2 className="fs-4 fw-bold">Faktury i abonament</h2>
                        <p className="text-muted small">
                            Historia faktur za korzystanie z systemu
                        </p>
                    </div>

                    {loading ? (
                        <div className="salonbw-loading">Ładowanie...</div>
                    ) : !data?.length ? (
                        <div className="text-center py-5 text-muted">
                            <p className="fw-medium">Brak faktur</p>
                            <p className="small mt-1">
                                Faktury pojawią się tutaj po dokonaniu płatności
                            </p>
                        </div>
                    ) : (
                        <div className="salonbw-table-wrap">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Numer faktury</th>
                                        <th>Data wystawienia</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((inv) => (
                                        <tr key={inv.id}>
                                            <td className="fw-medium">
                                                {inv.number}
                                            </td>
                                            <td>{formatDate(inv.createdAt)}</td>
                                            <td>
                                                <span
                                                    className={`badge ${inv.status === 'paid' ? 'badge-salon-success' : inv.status === 'overdue' ? 'badge-salon-danger' : 'badge-salon'}`}
                                                >
                                                    {STATUS_LABELS[
                                                        inv.status
                                                    ] ?? inv.status}
                                                </span>
                                            </td>
                                            <td>
                                                {inv.pdfUrl && (
                                                    <a
                                                        className="btn btn-link p-0 small"
                                                        href={inv.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Pobierz PDF
                                                    </a>
                                                )}
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
