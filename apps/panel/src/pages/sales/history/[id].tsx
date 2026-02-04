'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSale } from '@/hooks/useWarehouseViews';

export default function WarehouseSaleDetailsPage() {
    const router = useRouter();
    const saleId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);
    const { data: sale, isLoading } = useWarehouseSale(saleId);

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia sprzedaży | SalonBW"
            heading={`Magazyn / Historia sprzedaży / ${sale?.saleNumber ?? ''}`}
            activeTab="sales"
            actions={
                <div className="flex justify-end gap-2">
                    <Link
                        href="/sales/history"
                        className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                    >
                        historia sprzedaży
                    </Link>
                    <Link
                        href="/sales/new"
                        className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                    >
                        dodaj sprzedaż
                    </Link>
                </div>
            }
        >
            {isLoading || !sale ? (
                <p className="py-8 text-sm text-gray-500">Ładowanie szczegółów sprzedaży...</p>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-[40px] leading-none text-gray-800">
                        Szczegóły sprzedaży
                    </h2>
                    <div className="overflow-x-auto border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                                <tr>
                                    <th className="px-3 py-2">lp</th>
                                    <th className="px-3 py-2">nazwa</th>
                                    <th className="px-3 py-2">cena netto</th>
                                    <th className="px-3 py-2">cena brutto</th>
                                    <th className="px-3 py-2">ilość</th>
                                    <th className="px-3 py-2">VAT</th>
                                    <th className="px-3 py-2">wartość brutto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item, index) => (
                                    <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-2">{index + 1}</td>
                                        <td className="px-3 py-2">
                                            <Link
                                                href={`/products/${item.productId ?? ''}`}
                                                className="text-sky-600 hover:underline"
                                            >
                                                {item.productName}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2">
                                            {Number(item.unitPriceNet).toFixed(2)} zł
                                        </td>
                                        <td className="px-3 py-2">
                                            {Number(item.unitPriceGross).toFixed(2)} zł
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td className="px-3 py-2">{item.vatRate}%</td>
                                        <td className="px-3 py-2">
                                            {Number(item.totalGross).toFixed(2)} zł
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                        <div>klient: {sale.clientName ?? '-'}</div>
                        <div>pracownik: {sale.employee?.name ?? '-'}</div>
                        <div>data sprzedaży: {new Date(sale.soldAt).toLocaleDateString('pl-PL')}</div>
                        <div>płatność: {sale.paymentMethod ?? '-'}</div>
                        <div>wartość netto: {Number(sale.totalNet ?? 0).toFixed(2)} zł</div>
                        <div>wartość brutto: {Number(sale.totalGross ?? 0).toFixed(2)} zł</div>
                    </div>
                </div>
            )}
        </WarehouseLayout>
    );
}
