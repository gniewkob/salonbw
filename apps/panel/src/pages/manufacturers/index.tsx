'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseProducts } from '@/hooks/useWarehouseViews';

export default function WarehouseManufacturersPage() {
    const { data: products = [], isLoading } = useWarehouseProducts({
        includeInactive: true,
    });

    const grouped = new Map<
        string,
        Array<{ id: number; name: string; sku?: string | null }>
    >();

    products.forEach((product) => {
        const manufacturer = (product.manufacturer || '').trim() || 'brak';
        const list = grouped.get(manufacturer) || [];
        list.push({ id: product.id, name: product.name, sku: product.sku });
        grouped.set(manufacturer, list);
    });

    const rows = Array.from(grouped.entries())
        .map(([manufacturer, list]) => ({
            manufacturer,
            productsCount: list.length,
            sample: list.slice(0, 3),
        }))
        .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer, 'pl'));

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Producenci | SalonBW"
            heading="Magazyn / Producenci"
            activeTab="deliveries"
            actions={
                <Link href="/products/new" className="btn btn-primary btn-xs">
                    dodaj produkt
                </Link>
            }
        >
            {isLoading ? (
                <p className="products-empty">Ładowanie producentów...</p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>producent</th>
                                <th>liczba produktów</th>
                                <th>przykładowe produkty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.manufacturer}>
                                    <td>{row.manufacturer}</td>
                                    <td>{row.productsCount}</td>
                                    <td>
                                        {row.sample.map((product, index) => (
                                            <span key={product.id}>
                                                <Link
                                                    href={`/products/${product.id}`}
                                                    className="products-link"
                                                >
                                                    {product.name}
                                                </Link>
                                                {index < row.sample.length - 1
                                                    ? ', '
                                                    : ''}
                                            </span>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="products-pagination">Producenci: {rows.length}</div>
        </WarehouseLayout>
    );
}
