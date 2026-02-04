'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsageEntry } from '@/hooks/useWarehouseViews';

export default function WarehouseUsageDetailsPage() {
    const router = useRouter();
    const usageId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);
    const { data, isLoading } = useWarehouseUsageEntry(usageId);

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Szczegóły zużycia | SalonBW"
            heading={`Magazyn / Historia zużycia / ${data?.usageNumber ?? ''}`}
            activeTab="use"
            actions={
                <Link
                    href="/use/history"
                    className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                >
                    historia zużycia
                </Link>
            }
        >
            {isLoading || !data ? (
                <p className="py-8 text-sm text-gray-500">
                    Ładowanie szczegółów zużycia...
                </p>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-[38px] leading-none text-gray-800">
                        Szczegóły zużycia
                    </h2>
                    <div className="overflow-x-auto border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                                <tr>
                                    <th className="px-3 py-2">nazwa</th>
                                    <th className="px-3 py-2">ilość</th>
                                    <th className="px-3 py-2">stan przed</th>
                                    <th className="px-3 py-2">stan po</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-gray-200 hover:bg-gray-50"
                                    >
                                        <td className="px-3 py-2">
                                            {item.productName}
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.stockBefore}
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.stockAfter}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </WarehouseLayout>
    );
}
