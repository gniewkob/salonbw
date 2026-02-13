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
    const [activeList, setActiveList] = useState<'services' | 'products'>(
        'services',
    );

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
    const servicesShare = 100;
    const productsShare = 0;
    const favoriteRows =
        activeList === 'services' ? stats.favoriteServices : [];

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

            <div className="customer-stats-share">
                <div className="customer-stats-share__head">
                    <div>
                        <div className="customer-stats-subtitle">
                            wykonane usługi: {stats.completedVisits}
                        </div>
                        <div className="customer-stats-share__amount">
                            {formatCurrency(stats.totalSpent)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="customer-stats-subtitle">
                            zakupione produkty: 0
                        </div>
                        <div className="customer-stats-share__amount customer-stats-share__amount--red">
                            {formatCurrency(0)}
                        </div>
                    </div>
                </div>
                <div className="customer-stats-share__bar">
                    <div
                        className="customer-stats-share__bar-services"
                        style={{ width: `${servicesShare}%` }}
                    />
                    <div
                        className="customer-stats-share__bar-products"
                        style={{ width: `${productsShare}%` }}
                    />
                </div>
                <div className="customer-stats-share__foot">
                    <span>{servicesShare}% udziałów</span>
                    <span>{productsShare}% udziałów</span>
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

            <div className="customer-stats-lists">
                <div className="customer-stats-lists__tabs">
                    <button
                        type="button"
                        className={`btn btn-default btn-xs ${activeList === 'services' ? 'active' : ''}`}
                        onClick={() => setActiveList('services')}
                    >
                        wykonane usługi {stats.favoriteServices.length}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-default btn-xs ${activeList === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveList('products')}
                    >
                        zakupione produkty 0
                    </button>
                </div>
                <div className="customer-stats-lists__content">
                    {favoriteRows.length === 0 ? (
                        <div className="customer-empty-state">Brak danych.</div>
                    ) : (
                        <div className="customer-stats-rows">
                            {favoriteRows.map((row) => (
                                <div
                                    key={row.serviceId}
                                    className="customer-stats-row"
                                >
                                    <div>
                                        <div className="customer-stats-row__title">
                                            <Link
                                                href={`/services/${row.serviceId}`}
                                            >
                                                {row.serviceName}
                                            </Link>
                                        </div>
                                        <div className="customer-stats-row__meta">
                                            popularność {row.count} razy
                                        </div>
                                    </div>
                                    <div className="customer-stats-row__right">
                                        ostatnio wykonano{' '}
                                        {formatDate(stats.lastVisitDate)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="versum-pagination-footer">
                        <span>
                            Pozycje od 1 do {Math.max(1, favoriteRows.length)} z{' '}
                            {Math.max(1, favoriteRows.length)}
                        </span>
                        <span>1 z 1</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
