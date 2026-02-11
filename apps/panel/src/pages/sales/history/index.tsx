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
                <Link href="/sales/new" className="btn btn-primary btn-xs">
                    dodaj sprzedaż
                </Link>
            }
        >
            {isLoading ? (
                <p className="products-empty">
                    Ładowanie historii sprzedaży...
                </p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>nr sprzedaży</th>
                                <th>data</th>
                                <th>klient</th>
                                <th>pozycje</th>
                                <th>wartość brutto</th>
                                <th>szczegóły</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td>{sale.saleNumber}</td>
                                    <td>
                                        {new Date(
                                            sale.soldAt,
                                        ).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td>{sale.clientName ?? '-'}</td>
                                    <td>
                                        {sale.summary?.totalItems ??
                                            sale.items?.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    Number(item.quantity ?? 0),
                                                0,
                                            ) ??
                                            0}
                                    </td>
                                    <td>
                                        {Number(sale.totalGross ?? 0).toFixed(
                                            2,
                                        )}{' '}
                                        zł
                                    </td>
                                    <td>
                                        <Link
                                            href={`/sales/history/${sale.id}`}
                                            className="products-link"
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
