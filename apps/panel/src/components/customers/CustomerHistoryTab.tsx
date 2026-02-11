'use client';

import { useState } from 'react';
import { useCustomerEventHistory } from '@/hooks/useCustomers';

interface Props {
    customerId: number;
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pl-PL');
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(amount);
}

export default function CustomerHistoryTab({ customerId }: Props) {
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useCustomerEventHistory(customerId, {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    });

    if (isLoading) {
        return (
            <div className="customer-loading">Ładowanie historii wizyt...</div>
        );
    }

    if (error || !data) {
        return (
            <div className="customer-error">
                <p>Nie udało się załadować historii wizyt</p>
            </div>
        );
    }

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));

    return (
        <div className="customer-history-tab">
            {data.items.length === 0 ? (
                <div className="customer-empty-state">Brak historii wizyt.</div>
            ) : (
                <table className="customers-history-table table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Usługa</th>
                            <th>Pracownik</th>
                            <th className="text-right">Cena</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((visit) => (
                            <tr key={visit.id}>
                                <td>
                                    {formatDate(visit.date)}{' '}
                                    {formatTime(visit.date)}
                                </td>
                                <td>{visit.service?.name || '-'}</td>
                                <td>{visit.employee?.name || '-'}</td>
                                <td className="text-right">
                                    {formatCurrency(visit.price)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {totalPages > 1 && (
                <div className="customers-history-pagination">
                    <span>
                        Strona {page} z {totalPages}
                    </span>
                    <div className="btn-group">
                        <button
                            type="button"
                            className="btn btn-default btn-xs"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            poprzednia
                        </button>
                        <button
                            type="button"
                            className="btn btn-default btn-xs"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                        >
                            następna
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
