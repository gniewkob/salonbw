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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    Historia wizyt
                </h3>
                {data && (
                    <span className="text-sm text-gray-500">
                        {data.total} wizyt łącznie
                    </span>
                )}
            </div>

            {data?.items.length === 0 ? (
                <div className="rounded-lg border bg-gray-50 p-8 text-center text-gray-500">
                    Brak historii wizyt
                </div>
            ) : (
                <div className="rounded-lg border bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Data
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Usługa
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Pracownik
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Cena
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data?.items.map((visit) => (
                                <tr key={visit.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="font-medium text-gray-900">
                                            {formatDate(visit.date)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {visit.time}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">
                                            {visit.service?.name || '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {visit.employee?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(visit.status)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                                        {formatCurrency(visit.price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-500">
                        Strona {page + 1} z {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Poprzednia
                        </button>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages - 1, p + 1))
                            }
                            disabled={page >= totalPages - 1}
                            className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Następna
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
