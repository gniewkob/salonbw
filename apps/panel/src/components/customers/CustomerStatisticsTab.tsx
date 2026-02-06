'use client';

import { useCustomerStatistics } from '@/hooks/useCustomers';

interface Props {
    customerId: number;
}

export default function CustomerStatisticsTab({ customerId }: Props) {
    const { data: stats, isLoading, error } = useCustomerStatistics(customerId);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pl-PL');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Ładowanie statystyk...</div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
                Błąd ładowania statystyk
            </div>
        );
    }

    const visitCompletionRate =
        stats.totalVisits > 0
            ? ((stats.completedVisits / stats.totalVisits) * 100).toFixed(1)
            : 0;

    return (
        <div className="space-y-6">
            {/* Summary Stats Tiles */}
            <div className="row">
                <div className="col-sm-3">
                    <div className="versum-tile">
                        <div className="versum-tile__value text-cyan">
                            {stats.totalVisits}
                        </div>
                        <div className="versum-tile__label">
                            Wszystkie wizyty
                        </div>
                    </div>
                </div>
                <div className="col-sm-3">
                    <div className="versum-tile">
                        <div className="versum-tile__value text-green">
                            {stats.completedVisits}
                        </div>
                        <div className="versum-tile__label">Zakończone</div>
                    </div>
                </div>
                <div className="col-sm-3">
                    <div className="versum-tile">
                        <div className="versum-tile__value text-red">
                            {stats.cancelledVisits}
                        </div>
                        <div className="versum-tile__label">Anulowane</div>
                    </div>
                </div>
                <div className="col-sm-3">
                    <div className="versum-tile">
                        <div className="versum-tile__value text-orange">
                            {stats.noShowVisits}
                        </div>
                        <div className="versum-tile__label">Nieobecności</div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-sm-8">
                    {/* Financial Stats Widget */}
                    <div className="versum-widget">
                        <div className="versum-widget__header">
                            <span>Statystyki finansowe</span>
                        </div>
                        <div className="versum-widget__content">
                            <div className="row">
                                <div className="col-sm-4">
                                    <div
                                        className="text-muted"
                                        style={{
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Łączne wydatki
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '24px',
                                            fontWeight: 600,
                                            color: '#4b94ce',
                                        }}
                                    >
                                        {formatCurrency(stats.totalSpent)}
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div
                                        className="text-muted"
                                        style={{
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Średnia wartość
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '24px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {formatCurrency(stats.averageSpent)}
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div
                                        className="text-muted"
                                        style={{
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Wskaźnik realizacji
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '24px',
                                            fontWeight: 600,
                                            color: '#5cb85c',
                                        }}
                                    >
                                        {visitCompletionRate}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Widget */}
                    <div
                        className="versum-widget"
                        style={{ marginTop: '20px' }}
                    >
                        <div className="versum-widget__header">
                            <span>Historia współpracy</span>
                        </div>
                        <div className="versum-widget__content">
                            <div className="row">
                                <div className="col-sm-6">
                                    <div
                                        className="text-muted"
                                        style={{ fontSize: '11px' }}
                                    >
                                        Pierwsza wizyta
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {formatDate(stats.firstVisitDate)}
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div
                                        className="text-muted"
                                        style={{ fontSize: '11px' }}
                                    >
                                        Ostatnia wizyta
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {formatDate(stats.lastVisitDate)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Chart Widget */}
                    {stats.visitsByMonth.length > 0 && (
                        <div
                            className="versum-widget"
                            style={{ marginTop: '20px' }}
                        >
                            <div className="versum-widget__header">
                                <span>Wizyty według miesięcy</span>
                            </div>
                            <div className="versum-widget__content">
                                <div className="space-y-2">
                                    {stats.visitsByMonth.map((month) => {
                                        const maxCount = Math.max(
                                            ...stats.visitsByMonth.map(
                                                (m) => m.count,
                                            ),
                                        );
                                        const widthPercent =
                                            maxCount > 0
                                                ? (month.count / maxCount) * 100
                                                : 0;

                                        return (
                                            <div
                                                key={month.month}
                                                className="flex items-center gap-3"
                                                style={{ marginBottom: '8px' }}
                                            >
                                                <div
                                                    className="text-muted"
                                                    style={{
                                                        width: '80px',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    {month.month}
                                                </div>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        background: '#f5f5f5',
                                                        height: '12px',
                                                        borderRadius: '6px',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: '100%',
                                                            background:
                                                                '#4b94ce',
                                                            width: `${widthPercent}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div
                                                    style={{
                                                        width: '60px',
                                                        textAlign: 'right',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {month.count}
                                                </div>
                                                <div
                                                    className="text-muted"
                                                    style={{
                                                        width: '90px',
                                                        textAlign: 'right',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        month.spent,
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-sm-4">
                    {/* Favorite Services */}
                    {stats.favoriteServices.length > 0 && (
                        <div className="versum-widget">
                            <div className="versum-widget__header">
                                <span>Najczęstsze usługi</span>
                            </div>
                            <div className="versum-widget__content">
                                <div className="space-y-3">
                                    {stats.favoriteServices.map(
                                        (service, index) => (
                                            <div
                                                key={service.serviceId}
                                                className="flex-between"
                                                style={{ marginBottom: '10px' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        style={{
                                                            color: '#999',
                                                            fontSize: '11px',
                                                            width: '15px',
                                                        }}
                                                    >
                                                        {index + 1}.
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '13px',
                                                        }}
                                                    >
                                                        {service.serviceName}
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-muted"
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    {service.count}x
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Favorite Employees */}
                    {stats.favoriteEmployees.length > 0 && (
                        <div
                            className="versum-widget"
                            style={{ marginTop: '20px' }}
                        >
                            <div className="versum-widget__header">
                                <span>Ulubieni pracownicy</span>
                            </div>
                            <div className="versum-widget__content">
                                <div className="space-y-3">
                                    {stats.favoriteEmployees.map(
                                        (employee, index) => (
                                            <div
                                                key={employee.employeeId}
                                                className="flex-between"
                                                style={{ marginBottom: '10px' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        style={{
                                                            color: '#999',
                                                            fontSize: '11px',
                                                            width: '15px',
                                                        }}
                                                    >
                                                        {index + 1}.
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '13px',
                                                        }}
                                                    >
                                                        {employee.employeeName}
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-muted"
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    {employee.count}x
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
