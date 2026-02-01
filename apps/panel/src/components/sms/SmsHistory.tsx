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
    rejected: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Odrzucono' },
};

export default function SmsHistory({ logs, loading }: Props) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">
                    Ładowanie historii...
                </span>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                Brak wysłanych wiadomości
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Odbiorca
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Treść
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Koszt
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => {
                        const status = STATUS_STYLES[log.status];
                        const dateStr = format(
                            parseISO(log.createdAt),
                            'd MMM yyyy, HH:mm',
                            { locale: pl },
                        );

                        return (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {dateStr}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {log.recipient}
                                    </div>
                                    {log.recipientUser && (
                                        <div className="text-xs text-gray-500">
                                            {log.recipientUser.name}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                        {log.content}
                                    </div>
                                    {log.template && (
                                        <div className="text-xs text-gray-500">
                                            Szablon: {log.template.name}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.text}`}
                                    >
                                        {status.label}
                                    </span>
                                    {log.errorMessage && (
                                        <div className="text-xs text-red-500 mt-1">
                                            {log.errorMessage}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {log.partsCount} SMS
                                    {log.cost > 0 && (
                                        <span className="ml-1 text-gray-400">
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
