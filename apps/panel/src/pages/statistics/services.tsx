import { useState } from 'react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import Link from 'next/link';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceRanking } from '@/hooks/useStatistics';

export default function ServicesStatisticsPage() {
    const { role } = useAuth();
    const [range, setRange] = useState<'week' | 'month' | 'last_month'>(
        'month',
    );
    const { data, isLoading } = useServiceRanking({ range });

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

    const getDateRangeLabel = () => {
        const today = new Date();
        switch (range) {
            case 'week':
                return `${format(subDays(today, 7), 'dd.MM.yyyy')} - ${format(today, 'dd.MM.yyyy')}`;
            case 'month':
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
        <VersumShell role={role}>
            <div className="versum-page" data-testid="services-statistics-page">
                <header className="versum-page__header">
                    <h1 className="versum-page__title">Statystyki / Usługi</h1>
                </header>

                <div className="versum-page__toolbar">
                    <div className="flex items-center gap-2">
                        <select
                            className="form-control versum-select"
                            value={range}
                            onChange={(e) => setRange(e.target.value as any)}
                        >
                            <option value="week">ostatnie 7 dni</option>
                            <option value="month">ostatnie 30 dni</option>
                            <option value="last_month">
                                poprzedni miesiąc
                            </option>
                        </select>
                        <span className="text-sm text-gray-500">
                            ({getDateRangeLabel()})
                        </span>
                    </div>
                    <button
                        type="button"
                        className="btn btn-default versum-toolbar-btn"
                        onClick={() => window.print()}
                    >
                        🖨️
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-4 text-sm versum-muted">Ładowanie...</div>
                ) : (
                    <div className="inner">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="border rounded p-4 text-center bg-blue-50">
                                <div className="text-sm text-gray-600 mb-2">
                                    Łączna liczba wizyt
                                </div>
                                <div className="text-2xl font-bold text-blue-700">
                                    {totalBookings}
                                </div>
                            </div>

                            <div className="border rounded p-4 text-center bg-green-50">
                                <div className="text-sm text-gray-600 mb-2">
                                    Łączny przychód
                                </div>
                                <div className="text-2xl font-bold text-green-700">
                                    {formatMoney(totalRevenue)}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="versum-table-wrap">
                            <table className="versum-table">
                                <thead>
                                    <tr>
                                        <th>Usługa</th>
                                        <th>Kategoria</th>
                                        <th className="text-right">
                                            Liczba wizyt
                                        </th>
                                        <th className="text-right">Przychód</th>
                                        <th className="text-right">
                                            Średnia cena
                                        </th>
                                        <th className="text-right">
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
                                                        className="versum-link"
                                                    >
                                                        {service.serviceName}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {service.categoryName ||
                                                        'Bez kategorii'}
                                                </td>
                                                <td className="text-right">
                                                    {service.bookingCount}
                                                </td>
                                                <td className="text-right font-semibold">
                                                    {formatMoney(
                                                        service.revenue,
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    {formatMoney(
                                                        service.averagePrice,
                                                    )}
                                                </td>
                                                <td className="text-right">
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
                                                className="text-center text-gray-500 py-4"
                                            >
                                                Brak danych w wybranym okresie
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {data && data.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan={2}>Łącznie</td>
                                            <td className="text-right">
                                                {totalBookings}
                                            </td>
                                            <td className="text-right">
                                                {formatMoney(totalRevenue)}
                                            </td>
                                            <td className="text-right">
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
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
