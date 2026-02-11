'use client';

import { useCustomerStatistics } from '@/hooks/useCustomers';

interface Props {
    customerId: number;
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
    const { data: stats, isLoading, error } = useCustomerStatistics(customerId);

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

            <div className="customer-stats-history">
                <div className="customer-stats-history-title">
                    Historia współpracy
                </div>
                <div className="customer-stats-history-grid">
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
    );
}
