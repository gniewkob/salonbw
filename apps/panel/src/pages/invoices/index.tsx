import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoices } from '@/hooks/useInvoices';

const STATUS_LABELS: Record<string, string> = {
    paid: 'Opłacona',
    unpaid: 'Nieopłacona',
    overdue: 'Zaległa',
    cancelled: 'Anulowana',
};

const STATUS_BADGE: Record<string, string> = {
    paid: 'bg-success',
    unpaid: 'bg-warning text-dark',
    overdue: 'bg-danger',
    cancelled: 'bg-secondary',
};

export default function InvoicesPage() {
    const { role } = useAuth();
    const { data: invoicesRaw, loading: isLoading, error, refetch } = useInvoices();
    const invoices = invoicesRaw ?? [];

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

                    {isLoading ? (
                        <div className="text-muted p-3">Ładowanie...</div>
                    ) : error ? (
                        <div className="d-flex flex-column gap-2 p-3">
                            <div className="text-danger">Nie udało się pobrać faktur.</div>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => void refetch()}
                            >
                                Odśwież
                            </button>
                        </div>
                    ) : (
                        <div className="salonbw-table-wrap">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Numer</th>
                                        <th>Data wystawienia</th>
                                        <th>Status</th>
                                        <th className="text-end">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-muted text-center py-4"
                                            >
                                                Brak faktur.
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td className="fw-medium">
                                                    {invoice.number}
                                                </td>
                                                <td>
                                                    {new Date(
                                                        invoice.createdAt,
                                                    ).toLocaleDateString('pl-PL')}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${STATUS_BADGE[invoice.status] ?? 'bg-secondary'}`}
                                                    >
                                                        {STATUS_LABELS[invoice.status] ??
                                                            invoice.status}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    {invoice.pdfUrl && (
                                                        <a
                                                            href={invoice.pdfUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn btn-sm btn-outline-secondary"
                                                        >
                                                            Pobierz PDF
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
