import { useMemo, useState } from 'react';
import Link from 'next/link';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerStats } from '@/hooks/useStatistics';

export default function CustomersStatisticsPage() {
    const { role } = useAuth();
    const [range, setRange] = useState<'month' | 'quarter' | 'year'>('month');
    const statsQuery = useMemo(() => {
        const today = new Date();
        const to = today.toISOString().split('T')[0];

        if (range === 'month') {
            return { range: 'this_month' as const };
        }

        if (range === 'quarter') {
            const from = new Date(today);
            from.setMonth(from.getMonth() - 3);
            return {
                range: 'custom' as const,
                from: from.toISOString().split('T')[0],
                to,
            };
        }

        const from = new Date(today);
        from.setFullYear(from.getFullYear() - 1);
        return {
            range: 'custom' as const,
            from: from.toISOString().split('T')[0],
            to,
        };
    }, [range]);
    const { data, isLoading } = useCustomerStats(statsQuery);

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

    if (!role) return null;

    return (
        <SalonShell role={role}>
            <div className="salonbw-page" data-testid="customers-statistics-page">
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
                                            {data.newCustomers}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-3">
                                    <div className="border rounded p-4 text-center bg-success bg-opacity-10">
                                        <div className="small text-muted mb-2">
                                            Powracający
                                        </div>
                                        <div className="fs-3 fw-bold text-success">
                                            {data.returningCustomers}
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
                                            {data.averageVisitsPerCustomer.toFixed(
                                                1,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top customers */}
                        {data &&
                            data.topCustomers &&
                            data.topCustomers.length > 0 && (
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
                                                {data.topCustomers.map(
                                                    (customer) => (
                                                        <tr
                                                            key={
                                                                customer.customerId
                                                            }
                                                        >
                                                            <td>
                                                                <Link
                                                                    href={`/customers/${customer.customerId}`}
                                                                    className="salonbw-link"
                                                                >
                                                                    {
                                                                        customer.customerName
                                                                    }
                                                                </Link>
                                                            </td>
                                                            <td className="text-end">
                                                                {customer.visits}
                                                            </td>
                                                            <td className="text-end fw-semibold">
                                                                {formatMoney(
                                                                    customer.totalSpent,
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

                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Szczegółowe raporty klientów
                            </h3>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <Link
                                        href="/statistics/customers/returning"
                                        className="d-block border rounded p-4 text-decoration-none h-100"
                                    >
                                        <div className="small text-muted mb-2">
                                            Powracalność klientów
                                        </div>
                                        <div className="fs-5 fw-semibold text-body mb-2">
                                            Zobacz pełny raport powrotów
                                        </div>
                                        <div className="small text-muted">
                                            Szczegółowy udział nowych i
                                            powracających klientów oraz wykresy
                                            trendu.
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-md-6">
                                    <Link
                                        href="/statistics/customers/origins"
                                        className="d-block border rounded p-4 text-decoration-none h-100"
                                    >
                                        <div className="small text-muted mb-2">
                                            Źródła klientów
                                        </div>
                                        <div className="fs-5 fw-semibold text-body mb-2">
                                            Sprawdź skąd trafiają klienci
                                        </div>
                                        <div className="small text-muted">
                                            Raport pokazuje najskuteczniejsze
                                            źródła pozyskania i rozkład wizyt.
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SalonShell>
    );
}
