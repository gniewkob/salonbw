'use client';

import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { SmsLog, SmsStatus } from '@/types';

interface Props {
    logs: SmsLog[];
    loading?: boolean;
}

const STATUS_STYLES: Record<
    SmsStatus,
    { bg: string; text: string; label: string }
> = {
    pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Oczekuje',
    },
    sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Wysłano' },
    delivered: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Dostarczono',
    },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Błąd' },
    rejected: {
        bg: 'bg-secondary bg-opacity-10',
        text: 'text-body',
        label: 'Odrzucono',
    },
};

export default function SmsHistory({ logs, loading }: Props) {
    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center py-5">
                <div className="rounded-circle h-6 w-6 border-bottom-2 border-primary"></div>
                <span className="ms-2 text-muted">Ładowanie historii...</span>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                Brak wysłanych wiadomości
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-100">
                <thead className="bg-light">
                    <tr>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Data
                        </th>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Odbiorca
                        </th>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Treść
                        </th>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Status
                        </th>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Koszt
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {logs.map((log) => {
                        const status = STATUS_STYLES[log.status];
                        const dateStr = format(
                            parseISO(log.createdAt),
                            'd MMM yyyy, HH:mm',
                            { locale: pl },
                        );

                        return (
                            <tr key={log.id} className="">
                                <td className="px-3 py-2 text-nowrap small text-muted">
                                    {dateStr}
                                </td>
                                <td className="px-3 py-2 text-nowrap">
                                    <div className="small fw-medium text-dark">
                                        {log.recipient}
                                    </div>
                                    {log.recipientUser && (
                                        <div className="small text-muted">
                                            {log.recipientUser.name}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="small text-dark text-truncate">
                                        {log.content}
                                    </div>
                                    {log.template && (
                                        <div className="small text-muted">
                                            Szablon: {log.template.name}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-nowrap">
                                    <span
                                        className={`px-2 py-1 rounded small fw-medium ${status.bg} ${status.text}`}
                                    >
                                        {status.label}
                                    </span>
                                    {log.errorMessage && (
                                        <div className="small text-danger mt-1">
                                            {log.errorMessage}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-nowrap small text-muted">
                                    {log.partsCount} SMS
                                    {log.cost > 0 && (
                                        <span className="ms-1 text-secondary">
                                            ({log.cost.toFixed(2)} PLN)
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
