'use client';

import { useState } from 'react';
import { Customer, CustomerGroup } from '@/types';
import {
    useCustomerStatistics,
    useCustomerEventHistory,
    useCustomerGroups,
    useAddGroupMembers,
    useRemoveGroupMember,
} from '@/hooks/useCustomers';

interface Props {
    customer: Customer;
}

export default function CustomerSummaryTab({
    customer: initialCustomer,
}: Props) {
    const [customer, setCustomer] = useState<Customer>(initialCustomer);
    const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);

    const { data: stats, isLoading: statsLoading } = useCustomerStatistics(
        customer.id,
    );
    const { data: history, isLoading: historyLoading } =
        useCustomerEventHistory(customer.id, { limit: 3 });
    const { data: allGroups } = useCustomerGroups();
    const addToGroup = useAddGroupMembers();
    const removeFromGroup = useRemoveGroupMember();

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

    // Grupy, do których klient NIE należy (dodawanie)
    const availableGroups =
        allGroups?.filter(
            (g) => !customer.groups?.some((cg) => cg.id === g.id),
        ) ?? [];

    const handleAddToGroup = async (groupId: number) => {
        await addToGroup.mutateAsync({
            groupId,
            customerIds: [customer.id],
        });
        // Aktualizuj lokalny stan
        const group = allGroups?.find((g) => g.id === groupId);
        if (group) {
            setCustomer((prev) => ({
                ...prev,
                groups: [...(prev.groups ?? []), group],
            }));
        }
        setShowAddToGroupModal(false);
    };

    const handleRemoveFromGroup = async (groupId: number) => {
        await removeFromGroup.mutateAsync({
            groupId,
            customerId: customer.id,
        });
        // Aktualizuj lokalny stan
        setCustomer((prev) => ({
            ...prev,
            groups: prev.groups?.filter((g) => g.id !== groupId) ?? [],
        }));
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

                                {/* Grupy klienta - jak w Versum */}
                                <div className="form-group">
                                    <label className="control-label">
                                        należy do grup
                                    </label>
                                    <div className="control-content">
                                        {customer.groups &&
                                        customer.groups.length > 0 ? (
                                            <div className="flex flex-wrap gap-4">
                                                {customer.groups.map(
                                                    (group) => (
                                                        <span
                                                            key={group.id}
                                                            className="inline-flex items-center px-8 py-2 rounded text-xs font-medium border group"
                                                            style={{
                                                                borderColor:
                                                                    group.color ||
                                                                    '#999',
                                                                color:
                                                                    group.color ||
                                                                    '#666',
                                                                backgroundColor:
                                                                    group.color
                                                                        ? `${group.color}15`
                                                                        : '#f5f5f5',
                                                            }}
                                                        >
                                                            <span
                                                                className="w-6 h-6 rounded-full mr-4"
                                                                style={{
                                                                    backgroundColor:
                                                                        group.color ||
                                                                        '#999',
                                                                }}
                                                            />
                                                            {group.name}
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveFromGroup(
                                                                        group.id,
                                                                    )
                                                                }
                                                                className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity text-current hover:text-red-500"
                                                                title="Usuń z grupy"
                                                                disabled={
                                                                    removeFromGroup.isPending
                                                                }
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">
                                                —
                                            </span>
                                        )}

                                        {/* Przycisk dodawania do grupy */}
                                        {availableGroups.length > 0 && (
                                            <button
                                                onClick={() =>
                                                    setShowAddToGroupModal(true)
                                                }
                                                className="mt-8 text-versum-blue hover:text-versum-blue-dark text-xs flex items-center gap-4"
                                            >
                                                <span className="text-sm">
                                                    +
                                                </span>
                                                dodaj do grupy
                                            </button>
                                        )}
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

            {/* Modal dodawania do grupy */}
            {showAddToGroupModal && (
                <div className="modal fade in" style={{ display: 'block' }}>
                    <div className="modal-dialog modal-sm">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() =>
                                        setShowAddToGroupModal(false)
                                    }
                                >
                                    ×
                                </button>
                                <h4 className="modal-title">Dodaj do grupy</h4>
                            </div>
                            <div className="modal-body">
                                {availableGroups.length === 0 ? (
                                    <p className="text-muted text-center">
                                        Brak dostępnych grup
                                    </p>
                                ) : (
                                    <ul className="list-group">
                                        {availableGroups.map((group) => (
                                            <li
                                                key={group.id}
                                                className="list-group-item cursor-pointer hover:bg-gray-50 flex items-center gap-8"
                                                onClick={() =>
                                                    handleAddToGroup(group.id)
                                                }
                                            >
                                                <span
                                                    className="w-12 h-12 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            group.color ||
                                                            '#999',
                                                    }}
                                                />
                                                <span className="flex-1">
                                                    {group.name}
                                                </span>
                                                {addToGroup.isPending && (
                                                    <span className="text-muted text-xs">
                                                        dodawanie...
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    onClick={() =>
                                        setShowAddToGroupModal(false)
                                    }
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop fade in"
                        onClick={() => setShowAddToGroupModal(false)}
                    />
                </div>
            )}
        </div>
    );
}
