'use client';

import { Customer } from '@/types';
import { useCustomerStatistics, useCustomerEventHistory } from '@/hooks/useCustomers';

interface Props {
    customer: Customer;
}

export default function CustomerSummaryTab({ customer }: Props) {
    const { data: stats, isLoading: statsLoading } = useCustomerStatistics(
        customer.id,
    );
    const { data: history, isLoading: historyLoading } = useCustomerEventHistory(
        customer.id,
        { limit: 3 },
    );

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

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Wizyty</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {statsLoading ? '...' : stats?.completedVisits ?? 0}
                    </div>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Wydano</div>
                    <div className="text-2xl font-semibold text-cyan-600">
                        {statsLoading ? '...' : formatCurrency(stats?.totalSpent ?? 0)}
                    </div>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Średnia wartość</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {statsLoading
                            ? '...'
                            : formatCurrency(stats?.averageSpent ?? 0)}
                    </div>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Ostatnia wizyta</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {statsLoading ? '...' : formatDate(stats?.lastVisitDate ?? null)}
                    </div>
                </div>
            </div>

            {/* Favorite Services */}
            {stats?.favoriteServices && stats.favoriteServices.length > 0 && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">
                        Ulubione usługi
                    </h3>
                    <div className="space-y-2">
                        {stats.favoriteServices.map((service) => (
                            <div
                                key={service.serviceId}
                                className="flex items-center justify-between"
                            >
                                <span className="text-gray-700">{service.serviceName}</span>
                                <span className="text-sm text-gray-500">
                                    {service.count}x
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Favorite Employees */}
            {stats?.favoriteEmployees && stats.favoriteEmployees.length > 0 && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">
                        Ulubieni pracownicy
                    </h3>
                    <div className="space-y-2">
                        {stats.favoriteEmployees.map((employee) => (
                            <div
                                key={employee.employeeId}
                                className="flex items-center justify-between"
                            >
                                <span className="text-gray-700">
                                    {employee.employeeName}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {employee.count}x
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Visits */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Ostatnie wizyty
                </h3>
                {historyLoading ? (
                    <p className="text-sm text-gray-500">Ładowanie...</p>
                ) : history?.items.length === 0 ? (
                    <p className="text-sm text-gray-500">Brak wizyt</p>
                ) : (
                    <div className="space-y-3">
                        {history?.items.map((visit) => (
                            <div
                                key={visit.id}
                                className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                            >
                                <div>
                                    <div className="font-medium text-gray-700">
                                        {visit.service?.name ?? 'Usługa'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formatDate(visit.date)} • {visit.employee?.name}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-gray-900">
                                        {formatCurrency(visit.price)}
                                    </div>
                                    <div
                                        className={`text-xs ${
                                            visit.status === 'completed'
                                                ? 'text-green-600'
                                                : visit.status === 'cancelled'
                                                  ? 'text-red-600'
                                                  : 'text-gray-500'
                                        }`}
                                    >
                                        {visit.status === 'completed'
                                            ? 'Zakończona'
                                            : visit.status === 'cancelled'
                                              ? 'Anulowana'
                                              : visit.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Contact Info */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Informacje kontaktowe
                </h3>
                <dl className="grid grid-cols-2 gap-4">
                    <div>
                        <dt className="text-xs text-gray-500">Telefon</dt>
                        <dd className="text-gray-900">{customer.phone || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">E-mail</dt>
                        <dd className="text-gray-900">{customer.email || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">Adres</dt>
                        <dd className="text-gray-900">
                            {[customer.address, customer.postalCode, customer.city]
                                .filter(Boolean)
                                .join(', ') || '-'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">Klient od</dt>
                        <dd className="text-gray-900">
                            {formatDate(customer.createdAt)}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
