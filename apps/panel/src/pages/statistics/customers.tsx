import { useState } from 'react';
import Link from 'next/link';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useClientStats } from '@/hooks/useStatistics';

export default function ClientsStatisticsPage() {
    const { role } = useAuth();
    const [range, setRange] = useState<'month' | 'quarter' | 'year'>('month');
    const { data, isLoading } = useClientStats({
        range:
            range === 'month'
                ? 'this_month'
                : range === 'quarter'
                  ? 'this_month'
                  : 'this_month',
    });

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

    if (!role) return null;

    return (
        <SalonShell role={role}>
            <div className="salonbw-page" data-testid="clients-statistics-page">
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_statistics"
                    items={[
                        { label: 'Statystyki', href: '/statistics' },
                        { label: 'Klienci' },
                    ]}
                />

                <div className="salonbw-page__toolbar">
                    <div className="d-flex align-items-center gap-2">
                        <select
                            className="form-control salonbw-select"
                            aria-label="Zakres czasu"
                            value={range}
                            onChange={(e) => {
                                const next = e.target.value;
                                if (
                                    next === 'month' ||
                                    next === 'quarter' ||
                                    next === 'year'
                                ) {
                                    setRange(next);
                                }
                            }}
                        >
                            <option value="month">ostatni miesiąc</option>
                            <option value="quarter">ostatnie 3 miesiące</option>
                            <option value="year">ostatni rok</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        className="btn btn-default salonbw-toolbar-btn"
                        onClick={() => window.print()}
                    >
                        🖨️
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-4 small salonbw-muted">Ładowanie...</div>
                ) : (
                    <div>
                        {/* Summary cards */}
                        {data && (
                            <div className="row g-4 mb-5">
                                <div className="col-3">
                                    <div className="border rounded p-4 text-center bg-primary bg-opacity-10">
                                        <div className="small text-muted mb-2">
                                            Nowi klienci
                                        </div>
                                        <div className="fs-3 fw-bold text-primary">
                                            {data.newClients}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-3">
                                    <div className="border rounded p-4 text-center bg-success bg-opacity-10">
                                        <div className="small text-muted mb-2">
                                            Powracający
                                        </div>
                                        <div className="fs-3 fw-bold text-success">
                                            {data.returningClients}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-3">
                                    <div className="border rounded p-4 text-center">
                                        <div className="small text-muted mb-2">
                                            Łącznie wizyt
                                        </div>
                                        <div className="fs-3 fw-bold">
                                            {data.totalVisits}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-3">
                                    <div className="border rounded p-4 text-center">
                                        <div className="small text-muted mb-2">
                                            Średnio wizyt/klient
                                        </div>
                                        <div className="fs-3 fw-bold">
                                            {data.averageVisitsPerClient.toFixed(
                                                1,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top clients */}
                        {data &&
                            data.topClients &&
                            data.topClients.length > 0 && (
                                <div className="mb-5">
                                    <h3 className="fs-5 fw-semibold mb-3">
                                        Najlepsi klienci
                                    </h3>
                                    <div className="salonbw-table-wrap">
                                        <table className="salonbw-table">
                                            <thead>
                                                <tr>
                                                    <th>Klient</th>
                                                    <th className="text-end">
                                                        Liczba wizyt
                                                    </th>
                                                    <th className="text-end">
                                                        Łącznie wydane
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.topClients.map(
                                                    (client) => (
                                                        <tr
                                                            key={
                                                                client.clientId
                                                            }
                                                        >
                                                            <td>
                                                                <Link
                                                                    href={`/customers/${client.clientId}`}
                                                                    className="salonbw-link"
                                                                >
                                                                    {
                                                                        client.clientName
                                                                    }
                                                                </Link>
                                                            </td>
                                                            <td className="text-end">
                                                                {client.visits}
                                                            </td>
                                                            <td className="text-end fw-semibold">
                                                                {formatMoney(
                                                                    client.totalSpent,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        {/* Placeholder for returning customers by employee */}
                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Powracalność klientów
                            </h3>
                            <div className="text-muted fst-italic">
                                Szczegółowy raport powracalności w przygotowaniu
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SalonShell>
    );
}
