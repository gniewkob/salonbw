import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useEmails } from '@/hooks/useEmails';

const statusBadge: Record<string, string> = {
    sent: 'text-bg-success',
    failed: 'text-bg-danger',
    pending: 'text-bg-warning',
};

const statusLabel: Record<string, string> = {
    sent: 'wysłany',
    failed: 'błąd',
    pending: 'oczekuje',
};

export default function EmailList() {
    const { data, loading } = useEmails();

    return (
        <div className="customers_index" id="customers_main">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_communication"
                items={[
                    { label: 'Łączność', href: '/communication' },
                    { label: 'Historia emaili' },
                ]}
            />

            {loading ? (
                <p className="text-muted">Ładowanie historii emaili...</p>
            ) : data.length === 0 ? (
                <p className="products-empty">Brak wysłanych emaili.</p>
            ) : (
                <div>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Odbiorca</th>
                                <th>Temat</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((e, i) => (
                                <tr
                                    key={e.id}
                                    className={i % 2 === 0 ? 'odd' : 'even'}
                                >
                                    <td>{e.recipient}</td>
                                    <td>{e.subject}</td>
                                    <td>
                                        <span
                                            className={`badge ${statusBadge[e.status] ?? 'text-bg-secondary'}`}
                                        >
                                            {statusLabel[e.status] ?? e.status}
                                        </span>
                                    </td>
                                    <td className="small">
                                        {new Date(e.sentAt).toLocaleString(
                                            'pl-PL',
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
