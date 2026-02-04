'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsage } from '@/hooks/useWarehouseViews';

export default function WarehouseUsageHistoryPage() {
    const { data: usage = [], isLoading } = useWarehouseUsage();

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia zużycia | SalonBW"
            heading="Magazyn / Historia zużycia"
            activeTab="use"
            actions={
                <Link
                    href="/use/new"
                    className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                >
                    dodaj zużycie
                </Link>
            }
        >
            {isLoading ? (
                <p className="py-8 text-sm text-gray-500">
                    Ładowanie historii zużycia...
                </p>
            ) : (
                <div className="overflow-x-auto border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                            <tr>
                                <th className="px-3 py-2">nr zużycia</th>
                                <th className="px-3 py-2">data</th>
                                <th className="px-3 py-2">klient</th>
                                <th className="px-3 py-2">pracownik</th>
                                <th className="px-3 py-2">pozycje</th>
                                <th className="px-3 py-2">szczegóły</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usage.map((entry) => (
                                <tr
                                    key={entry.id}
                                    className="border-t border-gray-200 hover:bg-gray-50"
                                >
                                    <td className="px-3 py-2">
                                        {entry.usageNumber}
                                    </td>
                                    <td className="px-3 py-2">
                                        {new Date(
                                            entry.usedAt,
                                        ).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td className="px-3 py-2">
                                        {entry.clientName ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {entry.employee?.name ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {entry.summary?.totalItems ??
                                            entry.items?.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    Number(item.quantity ?? 0),
                                                0,
                                            ) ??
                                            0}
                                    </td>
                                    <td className="px-3 py-2">
                                        <Link
                                            href={`/use/history/${entry.id}`}
                                            className="text-sky-600 hover:underline"
                                        >
                                            otwórz
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </WarehouseLayout>
    );
}
