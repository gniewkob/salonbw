import { useState } from 'react';
import Link from 'next/link';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
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
        <SalonBWShell role={role}>
            <div className="salonbw-page" data-testid="clients-statistics-page">
                <ul className="breadcrumb">
                    <li>Statystyki</li>
                    <li>Klienci</li>
                </ul>

                <div className="salonbw-page__toolbar">
                    <div className="flex items-center gap-2">
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
                    <div className="p-4 text-sm salonbw-muted">
                        Ładowanie...
                    </div>
                ) : (
                    <div className="inner">
                        {/* Summary cards */}
                        {data && (
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="border rounded p-4 text-center bg-blue-50">
                                    <div className="text-sm text-gray-600 mb-2">
                                        Nowi klienci
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {data.newClients}
                                    </div>
                                </div>

                                <div className="border rounded p-4 text-center bg-green-50">
                                    <div className="text-sm text-gray-600 mb-2">
                                        Powracający
                                    </div>
                                    <div className="text-2xl font-bold text-green-700">
                                        {data.returningClients}
                                    </div>
                                </div>

                                <div className="border rounded p-4 text-center">
                                    <div className="text-sm text-gray-600 mb-2">
                                        Łącznie wizyt
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {data.totalVisits}
                                    </div>
                                </div>

                                <div className="border rounded p-4 text-center">
                                    <div className="text-sm text-gray-600 mb-2">
                                        Średnio wizyt/klient
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {data.averageVisitsPerClient.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top clients */}
                        {data &&
                            data.topClients &&
                            data.topClients.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-3">
                                        Najlepsi klienci
                                    </h3>
                                    <div className="salonbw-table-wrap">
                                        <table className="salonbw-table">
                                            <thead>
                                                <tr>
                                                    <th>Klient</th>
                                                    <th className="text-right">
                                                        Liczba wizyt
                                                    </th>
                                                    <th className="text-right">
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
                                                            <td className="text-right">
                                                                {client.visits}
                                                            </td>
                                                            <td className="text-right font-semibold">
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
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">
                                Powracalność klientów
                            </h3>
                            <div className="text-gray-500 italic">
                                Szczegółowy raport powracalności w przygotowaniu
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SalonBWShell>
    );
}
