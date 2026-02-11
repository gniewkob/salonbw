'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useStocktakingHistory } from '@/hooks/useWarehouseViews';

export default function InventoryHistoryPage() {
    const { data: rows = [], isLoading } = useStocktakingHistory();

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Inwentaryzacja | SalonBW"
            heading="Magazyn / Inwentaryzacja"
            activeTab="products"
            inventoryActive
            actions={
                <Link href="/inventory/new" className="btn btn-primary btn-xs">
                    nowa inwentaryzacja
                </Link>
            }
        >
            <h2 className="warehouse-section-title">HISTORIA INWENTARYZACJI</h2>
            {isLoading ? (
                <p className="products-empty">
                    Ładowanie historii inwentaryzacji...
                </p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>data i nazwa inwentaryzacji</th>
                                <th>liczba produktów</th>
                                <th>
                                    liczba produktów z niedoborem w magazynie
                                </th>
                                <th>liczba produktów z nadwyżką w magazynie</th>
                                <th>liczba produktów ze stanem zgodnym</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <Link
                                            href={`/inventory/${row.id}`}
                                            className="products-link"
                                        >
                                            {new Date(
                                                row.stocktakingDate,
                                            ).toLocaleDateString('pl-PL')}{' '}
                                            {row.stocktakingNumber}
                                        </Link>
                                    </td>
                                    <td>{row.productsCount}</td>
                                    <td>{row.shortageCount}</td>
                                    <td>{row.overageCount}</td>
                                    <td>{row.matchedCount}</td>
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
