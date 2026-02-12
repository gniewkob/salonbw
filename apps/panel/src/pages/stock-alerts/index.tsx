'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useLowStockProducts, useStockSummary } from '@/hooks/useStockAlerts';

export default function WarehouseLowStockPage() {
    const { data: rows = [], isLoading } = useLowStockProducts();
    const { data: summary } = useStockSummary();

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Niski stan magazynowy | SalonBW"
            heading="Magazyn / Niski stan magazynowy"
            activeTab="deliveries"
            actions={
                <Link href="/deliveries/new" className="btn btn-primary btn-xs">
                    dodaj dostawę
                </Link>
            }
        >
            {summary ? (
                <div className="products-pagination" style={{ paddingTop: 0 }}>
                    produkty: {summary.totalProducts} | niski stan:{' '}
                    {summary.lowStockCount} | brak na stanie:{' '}
                    {summary.outOfStockCount}
                </div>
            ) : null}

            {isLoading ? (
                <p className="products-empty">Ładowanie niskich stanów...</p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>nazwa</th>
                                <th>sku</th>
                                <th>stan</th>
                                <th>min.</th>
                                <th>brak</th>
                                <th>dostawca</th>
                                <th>akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <Link
                                            href={`/products/${row.id}`}
                                            className="products-link"
                                        >
                                            {row.name}
                                        </Link>
                                    </td>
                                    <td>{row.sku ?? '-'}</td>
                                    <td>
                                        {row.stock} {row.unit ?? 'op.'}
                                    </td>
                                    <td>
                                        {row.minQuantity} {row.unit ?? 'op.'}
                                    </td>
                                    <td>
                                        {row.deficit} {row.unit ?? 'op.'}
                                    </td>
                                    <td>{row.defaultSupplierName ?? '-'}</td>
                                    <td className="col-actions">
                                        <Link
                                            href="/deliveries/new"
                                            className="products-action-link"
                                        >
                                            dostawa
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="products-pagination">
                Pozycje od 1 do {rows.length} | na stronie 20
            </div>
        </WarehouseLayout>
    );
}
