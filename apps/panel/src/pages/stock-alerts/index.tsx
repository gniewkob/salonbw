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
            activeTab="products"
        >
            {summary ? (
                <div className="products-pagination pt-0">
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

            <div className="products-export">
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                        const header = [
                            'Nazwa',
                            'SKU',
                            'Stan',
                            'Min.',
                            'Brak',
                            'Dostawca',
                        ];
                        const data = rows.map((row) => [
                            row.name,
                            row.sku ?? '',
                            `${row.stock} ${row.unit ?? 'op.'}`,
                            `${row.minQuantity} ${row.unit ?? 'op.'}`,
                            `${row.deficit} ${row.unit ?? 'op.'}`,
                            row.defaultSupplierName ?? '',
                        ]);
                        const csv = [header, ...data]
                            .map((line) =>
                                line
                                    .map(
                                        (v) =>
                                            `"${String(v).replaceAll('"', '""')}"`,
                                    )
                                    .join(';'),
                            )
                            .join('\n');
                        const blob = new Blob([`﻿${csv}`], {
                            type: 'text/csv;charset=utf-8;',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'niski-stan.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    <div
                        className="icon sprite-exel_blue mr-xs"
                        aria-hidden="true"
                    />
                    pobierz listę niskich stanów w pliku Excel
                </button>
            </div>
        </WarehouseLayout>
    );
}
