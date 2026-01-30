'use client';

import type { CashRegisterSummary } from '@/types';

interface Props {
    data: CashRegisterSummary | null;
    loading?: boolean;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Gotówka',
    card: 'Karta',
    transfer: 'Przelew',
    online: 'Online',
    voucher: 'Voucher',
};

export default function CashRegister({ data, loading }: Props) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!data || data.entries.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                Brak transakcji w wybranym dniu
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Suma</p>
                    <p className="text-2xl font-bold text-green-700">
                        {data.totals.total.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Gotówka</p>
                    <p className="text-xl font-bold text-blue-700">
                        {data.totals.cash.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Karta</p>
                    <p className="text-xl font-bold text-purple-700">
                        {data.totals.card.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <p className="text-sm text-yellow-600 font-medium">Napiwki</p>
                    <p className="text-xl font-bold text-yellow-700">
                        {data.totals.tips.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
            </div>

            {/* Entries table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Godzina
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Opis
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Klient
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pracownik
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Płatność
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kwota
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Napiwek
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {entry.time}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="font-medium text-gray-900">
                                        {entry.description}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {entry.clientName || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {entry.employeeName || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${
                                            entry.paymentMethod === 'cash'
                                                ? 'bg-green-100 text-green-700'
                                                : entry.paymentMethod === 'card'
                                                  ? 'bg-purple-100 text-purple-700'
                                                  : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {PAYMENT_METHOD_LABELS[entry.paymentMethod] ||
                                            entry.paymentMethod}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <span className="font-semibold text-gray-900">
                                        {entry.amount.toLocaleString('pl-PL')} PLN
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                    {entry.tip > 0 ? (
                                        <span className="text-green-600">
                                            +{entry.tip.toLocaleString('pl-PL')} PLN
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td
                                colSpan={5}
                                className="px-4 py-3 text-right font-medium text-gray-700"
                            >
                                Suma:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                {data.totals.total.toLocaleString('pl-PL')} PLN
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">
                                {data.totals.tips > 0
                                    ? `+${data.totals.tips.toLocaleString('pl-PL')} PLN`
                                    : '-'}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
