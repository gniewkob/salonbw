'use client';

import { Customer } from '@/types';
import {
    useCustomerStatistics,
    useCustomerEventHistory,
} from '@/hooks/useCustomers';

interface Props {
    customer: Customer;
}

export default function CustomerSummaryTab({ customer }: Props) {
    const { data: stats, isLoading: statsLoading } = useCustomerStatistics(
        customer.id,
    );
    const { data: history, isLoading: historyLoading } =
        useCustomerEventHistory(customer.id, { limit: 3 });

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
        <div className="row">
            <div className="col-sm-12">
                {/* KPI Tiles */}
                <div className="row mb-20 ml-0 mr-0">
                    <div className="col-xs-6 col-sm-3 px-5">
                        <div className="versum-tile">
                            <div className="versum-tile__label">Wizyty</div>
                            <div className="versum-tile__value">
                                {statsLoading
                                    ? '...'
                                    : (stats?.completedVisits ?? 0)}
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-6 col-sm-3 px-5">
                        <div className="versum-tile">
                            <div className="versum-tile__label">Wydano</div>
                            <div className="versum-tile__value text-accent">
                                {statsLoading
                                    ? '...'
                                    : formatCurrency(stats?.totalSpent ?? 0)}
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-6 col-sm-3 px-5">
                        <div className="versum-tile">
                            <div className="versum-tile__label">
                                Średnia wartość
                            </div>
                            <div className="versum-tile__value">
                                {statsLoading
                                    ? '...'
                                    : formatCurrency(stats?.averageSpent ?? 0)}
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-6 col-sm-3 px-5">
                        <div className="versum-tile">
                            <div className="versum-tile__label">
                                Ostatnia wizyta
                            </div>
                            <div className="versum-tile__value">
                                {statsLoading
                                    ? '...'
                                    : formatDate(stats?.lastVisitDate ?? null)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-sm-6">
                        {/* Favorite Services */}
                        <div className="versum-widget">
                            <div className="versum-widget__header">
                                Ulubione usługi
                            </div>
                            <div className="versum-widget__content">
                                {stats?.favoriteServices &&
                                stats.favoriteServices.length > 0 ? (
                                    <ul className="list-unstyled">
                                        {stats.favoriteServices.map(
                                            (service) => (
                                                <li
                                                    key={service.serviceId}
                                                    className="flex-between border-bottom py-5"
                                                >
                                                    <span>
                                                        {service.serviceName}
                                                    </span>
                                                    <span className="text-muted">
                                                        {service.count}x
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                ) : (
                                    <p className="text-muted text-center">
                                        Brak danych
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recent Visits */}
                        <div className="versum-widget">
                            <div className="versum-widget__header">
                                Ostatnie wizyty
                            </div>
                            <div className="versum-widget__content">
                                {historyLoading ? (
                                    <p className="text-muted text-center">
                                        Ładowanie...
                                    </p>
                                ) : history?.items.length === 0 ? (
                                    <p className="text-muted text-center">
                                        Brak wizyt
                                    </p>
                                ) : (
                                    <table className="versum-table fs-12">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Usługa</th>
                                                <th className="text-right">
                                                    Cena
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history?.items.map((visit) => (
                                                <tr key={visit.id}>
                                                    <td>
                                                        {formatDate(visit.date)}
                                                    </td>
                                                    <td>
                                                        {visit.service?.name}
                                                        <br />
                                                        <small className="text-muted">
                                                            {
                                                                visit.employee
                                                                    ?.name
                                                            }
                                                        </small>
                                                    </td>
                                                    <td className="text-right">
                                                        {formatCurrency(
                                                            visit.price,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6">
                        {/* Contact Info */}
                        <div className="versum-widget">
                            <div className="versum-widget__header">
                                Informacje kontaktowe
                            </div>
                            <div className="versum-widget__content form-horizontal">
                                <div className="form-group">
                                    <label className="control-label">
                                        Telefon
                                    </label>
                                    <div className="control-content">
                                        {customer.phone || '-'}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="control-label">
                                        E-mail
                                    </label>
                                    <div className="control-content">
                                        {customer.email || '-'}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="control-label">
                                        Adres
                                    </label>
                                    <div className="control-content">
                                        {[
                                            customer.address,
                                            customer.postalCode,
                                            customer.city,
                                        ]
                                            .filter(Boolean)
                                            .join(', ') || '-'}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="control-label">
                                        Klient od
                                    </label>
                                    <div className="control-content">
                                        {formatDate(customer.createdAt)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Favorite Employees */}
                        {stats?.favoriteEmployees &&
                            stats.favoriteEmployees.length > 0 && (
                                <div className="versum-widget">
                                    <div className="versum-widget__header">
                                        Ulubieni pracownicy
                                    </div>
                                    <div className="versum-widget__content">
                                        <ul className="list-unstyled">
                                            {stats.favoriteEmployees.map(
                                                (employee) => (
                                                    <li
                                                        key={
                                                            employee.employeeId
                                                        }
                                                        className="flex-between border-bottom py-5"
                                                    >
                                                        <span>
                                                            {
                                                                employee.employeeName
                                                            }
                                                        </span>
                                                        <span className="text-muted">
                                                            {employee.count}x
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}
