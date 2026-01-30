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
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-2xl font-semibold text-cyan-600">
                        {stats.totalVisits}
                    </div>
                    <div className="text-sm text-gray-500">Wszystkie wizyty</div>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-2xl font-semibold text-green-600">
                        {stats.completedVisits}
                    </div>
                    <div className="text-sm text-gray-500">Zakończone</div>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-2xl font-semibold text-red-600">
                        {stats.cancelledVisits}
                    </div>
                    <div className="text-sm text-gray-500">Anulowane</div>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-2xl font-semibold text-orange-600">
                        {stats.noShowVisits}
                    </div>
                    <div className="text-sm text-gray-500">Nieobecności</div>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    Statystyki finansowe
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                    <div>
                        <div className="text-3xl font-semibold text-cyan-600">
                            {formatCurrency(stats.totalSpent)}
                        </div>
                        <div className="text-sm text-gray-500">Łączne wydatki</div>
                    </div>
                    <div>
                        <div className="text-3xl font-semibold text-gray-800">
                            {formatCurrency(stats.averageSpent)}
                        </div>
                        <div className="text-sm text-gray-500">Średnia wartość wizyty</div>
                    </div>
                    <div>
                        <div className="text-3xl font-semibold text-green-600">
                            {visitCompletionRate}%
                        </div>
                        <div className="text-sm text-gray-500">Wskaźnik realizacji</div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    Historia współpracy
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <div className="text-sm text-gray-500">Pierwsza wizyta</div>
                        <div className="text-lg font-medium text-gray-800">
                            {formatDate(stats.firstVisitDate)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Ostatnia wizyta</div>
                        <div className="text-lg font-medium text-gray-800">
                            {formatDate(stats.lastVisitDate)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Chart (Simple Bar Chart) */}
            {stats.visitsByMonth.length > 0 && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                        Wizyty według miesięcy
                    </h3>
                    <div className="space-y-2">
                        {stats.visitsByMonth.map((month) => {
                            const maxCount = Math.max(
                                ...stats.visitsByMonth.map((m) => m.count),
                            );
                            const widthPercent =
                                maxCount > 0 ? (month.count / maxCount) * 100 : 0;

                            return (
                                <div key={month.month} className="flex items-center gap-3">
                                    <div className="w-20 text-sm text-gray-500">
                                        {month.month}
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className="h-6 rounded bg-cyan-500"
                                            style={{ width: `${widthPercent}%` }}
                                        />
                                    </div>
                                    <div className="w-16 text-right text-sm font-medium text-gray-700">
                                        {month.count} wizyt
                                    </div>
                                    <div className="w-24 text-right text-sm text-gray-500">
                                        {formatCurrency(month.spent)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Favorite Services */}
            {stats.favoriteServices.length > 0 && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                        Najczęściej wybierane usługi
                    </h3>
                    <div className="space-y-3">
                        {stats.favoriteServices.map((service, index) => (
                            <div
                                key={service.serviceId}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {service.serviceName}
                                    </span>
                                </div>
                                <span className="text-gray-500">{service.count} razy</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Favorite Employees */}
            {stats.favoriteEmployees.length > 0 && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                        Ulubieni pracownicy
                    </h3>
                    <div className="space-y-3">
                        {stats.favoriteEmployees.map((employee, index) => (
                            <div
                                key={employee.employeeId}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {employee.employeeName}
                                    </span>
                                </div>
                                <span className="text-gray-500">{employee.count} wizyt</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
