'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCustomerStatistics } from '@/hooks/useCustomers';

interface Props {
    customerId: number;
}

function toIsoDate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('pl-PL');
}

export default function CustomerStatisticsTab({ customerId }: Props) {
    const today = new Date();
    const defaultTo = toIsoDate(today);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const defaultFrom = toIsoDate(oneYearAgo);

    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);

    const {
        data: stats,
        isLoading,
        error,
    } = useCustomerStatistics(customerId, {
        from,
        to,
    });

    const chart = useMemo(() => {
        const points = stats?.visitsByMonth ?? [];
        const maxSpent = Math.max(0, ...points.map((p) => p.spent));
        return { points, maxSpent };
    }, [stats?.visitsByMonth]);

    if (isLoading) {
        return <div className="customer-loading">Ładowanie statystyk...</div>;
    }

    if (error || !stats) {
        return (
            <div className="customer-error">
                <p>Nie udało się załadować statystyk klienta</p>
            </div>
        );
    }

    const completionRate =
        stats.totalVisits > 0
            ? Math.round((stats.completedVisits / stats.totalVisits) * 100)
            : 0;

    return (
        <div className="customer-statistics-tab">
            <div className="customer-stats-toolbar">
                <div className="customer-stats-period">
                    <span className="customer-stats-period__label">okres</span>
                    <input
                        type="date"
                        className="form-control input-sm"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                    <span className="customer-stats-period__sep">-</span>
                    <input
                        type="date"
                        className="form-control input-sm"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
            </div>

            <div className="customer-stats-grid">
                <div className="customer-stats-col">
                    <div className="customer-stats-value customer-stats-value--all">
                        {stats.totalVisits}
                    </div>
                    <div className="customer-stats-label">Wszystkie wizyty</div>
                </div>
                <div className="customer-stats-col">
                    <div className="customer-stats-value customer-stats-value--ok">
                        {stats.completedVisits}
                    </div>
                    <div className="customer-stats-label">Zakończone</div>
                </div>
                <div className="customer-stats-col">
                    <div className="customer-stats-value customer-stats-value--cancelled">
                        {stats.cancelledVisits}
                    </div>
                    <div className="customer-stats-label">Anulowane</div>
                </div>
                <div className="customer-stats-col">
                    <div className="customer-stats-value customer-stats-value--noshow">
                        {stats.noShowVisits}
                    </div>
                    <div className="customer-stats-label">Nieobecności</div>
                </div>
            </div>

            <div className="customer-stats-kpis">
                <div>
                    <div className="customer-stats-subtitle">
                        Łączne wydatki
                    </div>
                    <div className="customer-stats-amount">
                        {formatCurrency(stats.totalSpent)}
                    </div>
                </div>
                <div>
                    <div className="customer-stats-subtitle">
                        Średnia wartość
                    </div>
                    <div className="customer-stats-amount">
                        {formatCurrency(stats.averageSpent)}
                    </div>
                </div>
                <div>
                    <div className="customer-stats-subtitle">
                        Wskaźnik realizacji
                    </div>
                    <div className="customer-stats-amount">
                        {completionRate}%
                    </div>
                </div>
            </div>

            <div className="customer-stats-panels">
                <div className="customer-stats-panel">
                    <div className="customer-stats-panel__header">
                        obroty klienta: {formatCurrency(stats.totalSpent)}
                    </div>
                    <div className="customer-stats-panel__content">
                        {chart.points.length === 0 ? (
                            <div className="customer-empty-state">
                                Brak danych w wybranym okresie.
                            </div>
                        ) : (
                            <div className="customer-bar-chart">
                                {chart.points.map((p) => {
                                    const h =
                                        chart.maxSpent > 0
                                            ? Math.round(
                                                  (p.spent / chart.maxSpent) *
                                                      100,
                                              )
                                            : 0;
                                    const label = p.month.slice(5);
                                    return (
                                        <div
                                            key={p.month}
                                            className="customer-bar-chart__item"
                                            title={`${p.month}: ${formatCurrency(p.spent)} (${p.count} wizyt)`}
                                        >
                                            <div className="customer-bar-chart__barwrap">
                                                <div
                                                    className="customer-bar-chart__bar"
                                                    style={{
                                                        height: `${Math.max(2, h)}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="customer-bar-chart__label">
                                                {label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="customer-stats-panel">
                    <div className="customer-stats-panel__header">
                        historia współpracy
                    </div>
                    <div className="customer-stats-panel__content customer-stats-history-grid">
                        <div>
                            <div className="customer-stats-subtitle">
                                Pierwsza wizyta
                            </div>
                            <div>{formatDate(stats.firstVisitDate)}</div>
                        </div>
                        <div>
                            <div className="customer-stats-subtitle">
                                Ostatnia wizyta
                            </div>
                            <div>{formatDate(stats.lastVisitDate)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="customer-stats-favorites">
                <div className="customer-stats-favorites__col">
                    <div className="customer-stats-favorites__header">
                        wykonane usługi
                    </div>
                    <div className="customer-stats-favorites__content">
                        {stats.favoriteServices.length === 0 ? (
                            <div className="customer-empty-state">
                                Brak danych.
                            </div>
                        ) : (
                            <table className="customers-history-table table">
                                <thead>
                                    <tr>
                                        <th>Usługa</th>
                                        <th className="text-right">
                                            Popularność
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.favoriteServices.map((row) => (
                                        <tr key={row.serviceId}>
                                            <td>
                                                <Link
                                                    href={`/services/${row.serviceId}`}
                                                    className="link-more"
                                                >
                                                    {row.serviceName}
                                                </Link>
                                            </td>
                                            <td className="text-right">
                                                {row.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="customer-stats-favorites__col">
                    <div className="customer-stats-favorites__header">
                        obsługiwany przez
                    </div>
                    <div className="customer-stats-favorites__content">
                        {stats.favoriteEmployees.length === 0 ? (
                            <div className="customer-empty-state">
                                Brak danych.
                            </div>
                        ) : (
                            <table className="customers-history-table table">
                                <thead>
                                    <tr>
                                        <th>Pracownik</th>
                                        <th className="text-right">Wizyty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.favoriteEmployees.map((row) => (
                                        <tr key={row.employeeId}>
                                            <td>{row.employeeName}</td>
                                            <td className="text-right">
                                                {row.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
