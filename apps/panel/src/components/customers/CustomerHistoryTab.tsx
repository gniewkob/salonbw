'use client';

import { useState } from 'react';
import { useCustomerEventHistory } from '@/hooks/useCustomers';

interface Props {
    customerId: number;
}

const PAGE_SIZE = 10;

export default function CustomerHistoryTab({ customerId }: Props) {
    const [page, setPage] = useState(0);
    const { data, isLoading, error } = useCustomerEventHistory(customerId, {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            { label: string; className: string }
        > = {
            completed: {
                label: 'Zakończona',
                className: 'bg-green-100 text-green-800',
            },
            cancelled: {
                label: 'Anulowana',
                className: 'bg-red-100 text-red-800',
            },
            no_show: {
                label: 'Nieobecność',
                className: 'bg-orange-100 text-orange-800',
            },
            scheduled: {
                label: 'Zaplanowana',
                className: 'bg-blue-100 text-blue-800',
            },
            confirmed: {
                label: 'Potwierdzona',
                className: 'bg-cyan-100 text-cyan-800',
            },
            in_progress: {
                label: 'W trakcie',
                className: 'bg-purple-100 text-purple-800',
            },
        };

        const config = statusConfig[status] || {
            label: status,
            className: 'bg-gray-100 text-gray-800',
        };

        return (
            <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
            >
                {config.label}
            </span>
        );
    };

    if (isLoading && !data) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Ładowanie historii...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
                Błąd ładowania historii
            </div>
        );
    }

    const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>Historia wizyt</span>
                        {data && (
                            <span
                                className="text-muted"
                                style={{
                                    fontWeight: 'normal',
                                    fontSize: '11px',
                                }}
                            >
                                {data.total} wizyt łącznie
                            </span>
                        )}
                    </div>
                    <div className="versum-widget__content no-padding">
                        {data?.items.length === 0 ? (
                            <div
                                className="text-center"
                                style={{ padding: '40px', color: '#999' }}
                            >
                                Brak historii wizyt
                            </div>
                        ) : (
                            <table className="versum-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Usługa</th>
                                        <th>Pracownik</th>
                                        <th>Status</th>
                                        <th className="text-right">Cena</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.items.map((visit) => (
                                        <tr key={visit.id}>
                                            <td>
                                                <div
                                                    style={{ fontWeight: 600 }}
                                                >
                                                    {formatDate(visit.date)}
                                                </div>
                                                <div
                                                    className="text-muted"
                                                    style={{ fontSize: '11px' }}
                                                >
                                                    {visit.time}
                                                </div>
                                            </td>
                                            <td>
                                                {visit.service?.name || '-'}
                                            </td>
                                            <td>
                                                {visit.employee?.name || '-'}
                                            </td>
                                            <td>
                                                {getStatusBadge(visit.status)}
                                            </td>
                                            <td
                                                className="text-right"
                                                style={{ fontWeight: 600 }}
                                            >
                                                {formatCurrency(visit.price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="versum-pagination-footer">
                                <div>
                                    Strona {page + 1} z {totalPages}
                                </div>
                                <div className="btn-group">
                                    <button
                                        onClick={() =>
                                            setPage((p) => Math.max(0, p - 1))
                                        }
                                        disabled={page === 0}
                                        className="btn btn-default btn-xs"
                                    >
                                        <i className="icon-chevron-left"></i>{' '}
                                        Poprzednia
                                    </button>
                                    <button
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(totalPages - 1, p + 1),
                                            )
                                        }
                                        disabled={page >= totalPages - 1}
                                        className="btn btn-default btn-xs"
                                    >
                                        Następna{' '}
                                        <i className="icon-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
