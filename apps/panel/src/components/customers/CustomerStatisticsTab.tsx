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
            <div className="tab-pane active py-20 p-4 text-red-700">
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
                                    <div className="text-muted fz-11 uppercase">
                                        Łączne wydatki
                                    </div>
                                    <div className="fz-24 bold text-cyan">
                                        {formatCurrency(stats.totalSpent)}
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="text-muted fz-11 uppercase">
                                        Średnia wartość
                                    </div>
                                    <div className="fz-24 bold">
                                        {formatCurrency(stats.averageSpent)}
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="text-muted fz-11 uppercase">
                                        Wskaźnik realizacji
                                    </div>
                                    <div className="fz-24 bold text-green">
                                        {visitCompletionRate}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Widget */}
                    <div className="versum-widget mt-20">
                        <div className="versum-widget__header">
                            <span>Historia współpracy</span>
                        </div>
                        <div className="versum-widget__content">
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="text-muted fz-11">
                                        Pierwsza wizyta
                                    </div>
                                    <div className="fz-16 bold">
                                        {formatDate(stats.firstVisitDate)}
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="text-muted fz-11">
                                        Ostatnia wizyta
                                    </div>
                                    <div className="fz-16 bold">
                                        {formatDate(stats.lastVisitDate)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Chart Widget */}
                    {stats.visitsByMonth.length > 0 && (
                        <div className="versum-widget mt-20">
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
                                                className="flex items-center gap-3 mb-10"
                                            >
                                                <div className="text-muted fz-12 w-80">
                                                    {month.month}
                                                </div>
                                                {(() => {
                                                    const barStyle = {
                                                        '--dynamic-width': `${widthPercent}%`,
                                                    } as React.CSSProperties;
                                                    return (
                                                        // eslint-disable-next-line
                                                        <div
                                                            className="h-full bg-cyan w-dynamic"
                                                            style={barStyle}
                                                        />
                                                    );
                                                })()}
                                                <div className="text-right fz-12 bold w-60">
                                                    {month.count}
                                                </div>
                                                <div className="text-muted text-right fz-12 w-90">
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
                                                className="flex-between mb-10"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-999 fz-11 w-15">
                                                        {index + 1}.
                                                    </span>
                                                    <span className="fz-13">
                                                        {service.serviceName}
                                                    </span>
                                                </div>
                                                <span className="text-muted fz-12">
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
                        <div className="versum-widget mt-20">
                            <div className="versum-widget__header">
                                <span>Ulubieni pracownicy</span>
                            </div>
                            <div className="versum-widget__content">
                                <div className="space-y-3">
                                    {stats.favoriteEmployees.map(
                                        (employee, index) => (
                                            <div
                                                key={employee.employeeId}
                                                className="flex-between mb-10"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-999 fz-11 w-15">
                                                        {index + 1}.
                                                    </span>
                                                    <span className="fz-13">
                                                        {employee.employeeName}
                                                    </span>
                                                </div>
                                                <span className="text-muted fz-12">
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
