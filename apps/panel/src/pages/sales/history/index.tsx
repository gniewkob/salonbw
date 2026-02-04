'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';

export default function WarehouseSalesHistoryPage() {
    const { data: sales = [], isLoading } = useWarehouseSales();

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia sprzedaży | SalonBW"
            heading="Magazyn / Historia sprzedaży"
            activeTab="sales"
            actions={
                <Link
                    href="/sales/new"
                    className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                >
                    dodaj sprzedaż
                </Link>
            }
        >
            {isLoading ? (
                <p className="py-8 text-sm text-gray-500">
                    Ładowanie historii sprzedaży...
                </p>
            ) : (
                <div className="overflow-x-auto border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                            <tr>
                                <th className="px-3 py-2">nr sprzedaży</th>
                                <th className="px-3 py-2">data</th>
                                <th className="px-3 py-2">klient</th>
                                <th className="px-3 py-2">pozycje</th>
                                <th className="px-3 py-2">wartość brutto</th>
                                <th className="px-3 py-2">szczegóły</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr
                                    key={sale.id}
                                    className="border-t border-gray-200 hover:bg-gray-50"
                                >
                                    <td className="px-3 py-2">
                                        {sale.saleNumber}
                                    </td>
                                    <td className="px-3 py-2">
                                        {new Date(
                                            sale.soldAt,
                                        ).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td className="px-3 py-2">
                                        {sale.clientName ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {sale.summary?.totalItems ??
                                            sale.items?.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    Number(item.quantity ?? 0),
                                                0,
                                            ) ??
                                            0}
                                    </td>
                                    <td className="px-3 py-2">
                                        {Number(sale.totalGross ?? 0).toFixed(
                                            2,
                                        )}{' '}
                                        zł
                                    </td>
                                    <td className="px-3 py-2">
                                        <Link
                                            href={`/sales/history/${sale.id}`}
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
