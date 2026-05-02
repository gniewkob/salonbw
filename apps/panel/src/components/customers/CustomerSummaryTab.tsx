'use client';

import { useState } from 'react';
import { Customer } from '@/types';
import {
    useCustomerStatistics,
    useCustomerEventHistory,
    useCustomerGroups,
    useAddGroupMembers,
    useRemoveGroupMember,
} from '@/hooks/useCustomers';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';
import Link from 'next/link';

interface Props {
    customer: Customer;
}

export default function CustomerSummaryTab({
    customer: initialCustomer,
}: Props) {
    const [customer, setCustomer] = useState<Customer>(initialCustomer);
    const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
    const modalStyle = { display: 'block' };

    const { data: stats, isLoading: statsLoading } = useCustomerStatistics(
        customer.id,
    );
    const { data: history, isLoading: historyLoading } =
        useCustomerEventHistory(customer.id, { limit: 3 });
    const { data: fullHistory } = useCustomerEventHistory(customer.id, {
        limit: 20,
        status: 'completed',
    });
    const { data: allGroups } = useCustomerGroups();
    const addToGroup = useAddGroupMembers();
    const removeFromGroup = useRemoveGroupMember();
    const completedAppointmentIds = (
        fullHistory?.items
            .map((item) => item.id)
            .filter((id) => Number.isFinite(id) && id > 0) ?? []
    )
        .slice(0, 20)
        .join(',');
    const { data: linkedSales, isLoading: linkedSalesLoading } =
        useWarehouseSales({
            page: 1,
            pageSize: 5,
            appointmentIds:
                completedAppointmentIds.length > 0
                    ? completedAppointmentIds
                    : undefined,
            enabled: completedAppointmentIds.length > 0,
        });

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
                <div className="row mb-5 ml-0 mr-0">
                    <div className="col-xs-6 col-sm-3 px-3">
                        <div className="salonbw-tile">
                            <div className="salonbw-tile__label">Wizyty</div>
                            <div className="salonbw-tile__value">
                                {statsLoading
                                    ? '...'
                                    : (stats?.completedVisits ?? 0)}
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-6 col-sm-3 px-3">
                        <div className="salonbw-tile">
                            <div className="salonbw-tile__label">Wydano</div>
                            <div className="salonbw-tile__value text-accent">
                                {statsLoading
                                    ? '...'
                                    : formatCurrency(stats?.totalSpent ?? 0)}
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-6 col-sm-3 px-3">
                        <div className="salonbw-tile">
                            <div className="salonbw-tile__label">
                                Średnia wartość
                            </div>
                            <div className="salonbw-tile__value">
                                {statsLoading
                                    ? '...'
                                    : formatCurrency(stats?.averageSpent ?? 0)}
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-6 col-sm-3 px-3">
                        <div className="salonbw-tile">
                            <div className="salonbw-tile__label">
                                Ostatnia wizyta
                            </div>
                            <div className="salonbw-tile__value">
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
                        <div className="salonbw-widget">
                            <div className="salonbw-widget__header">
                                Ulubione usługi
                            </div>
                            <div className="salonbw-widget__content">
                                {stats?.favoriteServices &&
                                stats.favoriteServices.length > 0 ? (
                                    <ul className="list-unstyled">
                                        {stats.favoriteServices.map(
                                            (service) => (
                                                <li
                                                    key={service.serviceId}
                                                    className="flex-between border-bottom py-3"
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
                        <div className="salonbw-widget">
                            <div className="salonbw-widget__header">
                                Ostatnie wizyty
                            </div>
                            <div className="salonbw-widget__content">
                                {historyLoading ? (
                                    <p className="text-muted text-center">
                                        Ładowanie...
                                    </p>
                                ) : history?.items.length === 0 ? (
                                    <p className="text-muted text-center">
                                        Brak wizyt
                                    </p>
                                ) : (
                                    <table className="salonbw-table fs-12">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Usługa</th>
                                                <th className="text-end">
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
                                                    <td className="text-end">
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

                        <div className="salonbw-widget">
                            <div className="salonbw-widget__header d-flex justify-content-between align-items-center">
                                <span>Ostatnie sprzedaże</span>
                                {linkedSales &&
                                typeof linkedSales.total === 'number' ? (
                                    <span className="text-muted small">
                                        sprzedaże klienta ({linkedSales.total})
                                    </span>
                                ) : null}
                            </div>
                            <div className="salonbw-widget__content">
                                {linkedSalesLoading ? (
                                    <p className="text-muted text-center">
                                        Ładowanie...
                                    </p>
                                ) : !linkedSales ||
                                  linkedSales.items.length === 0 ? (
                                    <p className="text-muted text-center">
                                        Brak sprzedaży powiązanych z wizytami
                                        klienta
                                    </p>
                                ) : (
                                    <>
                                        <table className="salonbw-table fs-12">
                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Sprzedaż</th>
                                                    <th className="text-end">
                                                        Kwota
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {linkedSales.items.map(
                                                    (sale) => (
                                                        <tr key={sale.id}>
                                                            <td>
                                                                {formatDate(
                                                                    sale.soldAt,
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Link
                                                                    href={`/sales/history/${sale.id}`}
                                                                    className="link-more"
                                                                >
                                                                    {
                                                                        sale.saleNumber
                                                                    }
                                                                </Link>
                                                            </td>
                                                            <td className="text-end">
                                                                {formatCurrency(
                                                                    Number(
                                                                        sale.totalGross ??
                                                                            0,
                                                                    ),
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                        {completedAppointmentIds.length > 0 && (
                                            <div className="text-end mt-2">
                                                <Link
                                                    href={`/sales/history?appointmentIds=${completedAppointmentIds}`}
                                                    className="link-more"
                                                >
                                                    Zobacz wszystkie sprzedaże klienta
                                                    {linkedSales &&
                                                    typeof linkedSales.total ===
                                                        'number'
                                                        ? ` (${linkedSales.total})`
                                                        : ''}
                                                </Link>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6">
                        {/* Contact Info */}
                        <div className="salonbw-widget">
                            <div className="salonbw-widget__header">
                                Informacje kontaktowe
                            </div>
                            <div className="salonbw-widget__content form-horizontal">
                                <div className="form-">
                                    <label className="control-label">
                                        Telefon
                                    </label>
                                    <div className="control-content">
                                        {customer.phone || '-'}
                                    </div>
                                </div>
                                <div className="form-">
                                    <label className="control-label">
                                        E-mail
                                    </label>
                                    <div className="control-content">
                                        {customer.email || '-'}
                                    </div>
                                </div>
                                <div className="form-">
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
                                <div className="form-">
                                    <label className="control-label">
                                        Klient od
                                    </label>
                                    <div className="control-content">
                                        {formatDate(customer.createdAt)}
                                    </div>
                                </div>

                                {/* Grupy klienta - jak w source UI */}
                                <div className="form-">
                                    <label className="control-label">
                                        należy do grup
                                    </label>
                                    <div className="control-content">
                                        {customer.groups &&
                                        customer.groups.length > 0 ? (
                                            <div className="d-flex flex-wrap gap-3">
                                                {customer.groups.map(
                                                    (group) => {
                                                        const badgeStyle = {
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
                                                        };
                                                        const badgeDotStyle = {
                                                            backgroundColor:
                                                                group.color ||
                                                                '#999',
                                                        };
                                                        return (
                                                            <span
                                                                key={group.id}
                                                                className="inline-d-flex align-items-center px-4 py-2 rounded small fw-medium border"
                                                                {...{
                                                                    style: badgeStyle,
                                                                }}
                                                            >
                                                                <span
                                                                    className="w-6 h-6 rounded-circle me-3"
                                                                    {...{
                                                                        style: badgeDotStyle,
                                                                    }}
                                                                />
                                                                {group.name}
                                                                <button
                                                                    onClick={() => {
                                                                        void handleRemoveFromGroup(
                                                                            group.id,
                                                                        );
                                                                    }}
                                                                    className="ms-3 opacity-0 - -opacity text-current"
                                                                    title="Usuń z grupy"
                                                                    disabled={
                                                                        removeFromGroup.isPending
                                                                    }
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        );
                                                    },
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
                                                className="mt-4 text-salonbw-blue small d-flex align-items-center gap-3"
                                            >
                                                <span className="small">+</span>
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
                                <div className="salonbw-widget">
                                    <div className="salonbw-widget__header">
                                        Ulubieni pracownicy
                                    </div>
                                    <div className="salonbw-widget__content">
                                        <ul className="list-unstyled">
                                            {stats.favoriteEmployees.map(
                                                (employee) => (
                                                    <li
                                                        key={
                                                            employee.employeeId
                                                        }
                                                        className="flex-between border-bottom py-3"
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
                <div className="modal fade in" {...{ style: modalStyle }}>
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
                                    <ul className="list-">
                                        {availableGroups.map((group) => {
                                            const badgeDotStyle = {
                                                backgroundColor:
                                                    group.color || '#999',
                                            };
                                            return (
                                                <li
                                                    key={group.id}
                                                    className="list--item d-flex align-items-center gap-4"
                                                    onClick={() => {
                                                        void handleAddToGroup(
                                                            group.id,
                                                        );
                                                    }}
                                                >
                                                    <span
                                                        className="w-12 h-12 rounded-circle"
                                                        {...{
                                                            style: badgeDotStyle,
                                                        }}
                                                    />
                                                    <span className="flex-fill">
                                                        {group.name}
                                                    </span>
                                                    {addToGroup.isPending && (
                                                        <span className="text-muted small">
                                                            dodawanie...
                                                        </span>
                                                    )}
                                                </li>
                                            );
                                        })}
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
