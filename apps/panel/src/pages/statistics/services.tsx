import { useState } from 'react';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceRanking } from '@/hooks/useStatistics';

export default function ServicesStatisticsPage() {
    const { role } = useAuth();
    const [range, setRange] = useState<
        'this_week' | 'this_month' | 'last_month'
    >('this_month');
    const { data, isLoading } = useServiceRanking({ range });

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

    const getDateRangeLabel = () => {
        const today = new Date();
        switch (range) {
            case 'this_week':
                return `${format(subDays(today, 7), 'dd.MM.yyyy')} - ${format(today, 'dd.MM.yyyy')}`;
            case 'this_month':
                return `${format(subDays(today, 30), 'dd.MM.yyyy')} - ${format(today, 'dd.MM.yyyy')}`;
            case 'last_month':
                return 'poprzedni miesiąc';
            default:
                return '';
        }
    };

    if (!role) return null;

    const totalRevenue =
        data?.reduce((sum, item) => sum + item.revenue, 0) || 0;
    const totalBookings =
        data?.reduce((sum, item) => sum + item.bookingCount, 0) || 0;

    return (
        <SalonShell role={role}>
            <div
                className="salonbw-page"
                data-testid="services-statistics-page"
            >
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_statistics"
                    items={[
                        { label: 'Statystyki', href: '/statistics' },
                        { label: 'Usługi' },
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
                                    next === 'this_week' ||
                                    next === 'this_month' ||
                                    next === 'last_month'
                                ) {
                                    setRange(next);
                                }
                            }}
                        >
                            <option value="this_week">ostatnie 7 dni</option>
                            <option value="this_month">ostatnie 30 dni</option>
                            <option value="last_month">
                                poprzedni miesiąc
                            </option>
                        </select>
                        <span className="small text-muted">
                            ({getDateRangeLabel()})
                        </span>
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
                    <>
                        {/* Summary */}
                        <div className="row g-4 mb-5">
                            <div className="col-6">
                                <div className="border rounded p-4 text-center bg-primary bg-opacity-10">
                                    <div className="small text-muted mb-2">
                                        Łączna liczba wizyt
                                    </div>
                                    <div className="fs-3 fw-bold text-primary">
                                        {totalBookings}
                                    </div>
                                </div>
                            </div>

                            <div className="col-6">
                                <div className="border rounded p-4 text-center bg-success bg-opacity-10">
                                    <div className="small text-muted mb-2">
                                        Łączny przychód
                                    </div>
                                    <div className="fs-3 fw-bold text-success">
                                        {formatMoney(totalRevenue)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="salonbw-table-wrap">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Usługa</th>
                                        <th>Kategoria</th>
                                        <th className="text-end">
                                            Liczba wizyt
                                        </th>
                                        <th className="text-end">Przychód</th>
                                        <th className="text-end">
                                            Średnia cena
                                        </th>
                                        <th className="text-end">
                                            Średni czas
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data && data.length > 0 ? (
                                        data.map((service) => (
                                            <tr key={service.serviceId}>
                                                <td>
                                                    <Link
                                                        href={`/services/${service.serviceId}`}
                                                        className="salonbw-link"
                                                    >
                                                        {service.serviceName}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {service.categoryName ||
                                                        'Bez kategorii'}
                                                </td>
                                                <td className="text-end">
                                                    {service.bookingCount}
                                                </td>
                                                <td className="text-end fw-semibold">
                                                    {formatMoney(
                                                        service.revenue,
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    {formatMoney(
                                                        service.averagePrice,
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    {Math.round(
                                                        service.averageDuration,
                                                    )}{' '}
                                                    min
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center text-muted py-4"
                                            >
                                                Brak danych w wybranym okresie
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {data && data.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-light fw-bold">
                                            <td colSpan={2}>Łącznie</td>
                                            <td className="text-end">
                                                {totalBookings}
                                            </td>
                                            <td className="text-end">
                                                {formatMoney(totalRevenue)}
                                            </td>
                                            <td className="text-end">
                                                {formatMoney(
                                                    totalBookings > 0
                                                        ? totalRevenue /
                                                              totalBookings
                                                        : 0,
                                                )}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </>
                )}
            </div>
        </SalonShell>
    );
}
