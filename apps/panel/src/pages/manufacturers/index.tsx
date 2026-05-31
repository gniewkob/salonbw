'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseProducts } from '@/hooks/useWarehouseViews';

export default function WarehouseManufacturersPage() {
    const { data: products = [], isLoading } = useWarehouseProducts({
        includeInactive: true,
    });
    const [search, setSearch] = useState('');

    const rows = useMemo(() => {
        const grouped = new Map<
            string,
            Array<{ id: number; name: string; sku?: string | null }>
        >();
        products.forEach((product) => {
            const manufacturer =
                (product.manufacturer || product.brand || '').trim() || 'brak';
            const list = grouped.get(manufacturer) ?? [];
            list.push({ id: product.id, name: product.name, sku: product.sku });
            grouped.set(manufacturer, list);
        });
        return Array.from(grouped.entries())
            .map(([manufacturer, list]) => ({
                manufacturer,
                productsCount: list.length,
                sample: list.slice(0, 3),
                all: list,
            }))
            .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer, 'pl'));
    }, [products]);

    const filtered = search.trim()
        ? rows.filter((r) =>
              r.manufacturer
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
          )
        : rows;

    const exportCsv = () => {
        const header = ['Producent', 'Liczba produktów', 'Produkty'];
        const data = filtered.map((r) => [
            r.manufacturer,
            String(r.productsCount),
            r.all.map((p) => p.name).join(', '),
        ]);
        const csv = [header, ...data]
            .map((line) =>
                line
                    .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                    .join(';'),
            )
            .join('\n');
        const blob = new Blob([`﻿${csv}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'producenci.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Producenci | SalonBW"
            heading="Magazyn / Producenci"
            activeTab="deliveries"
        >
            <div className="row mb-3">
                <div className="col-sm-6">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="wyszukaj producenta"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <p className="products-empty">Ładowanie producentów...</p>
            ) : filtered.length === 0 ? (
                <p className="products-empty">Brak producentów.</p>
            ) : (
                <div>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Producent</th>
                                <th>Liczba produktów</th>
                                <th>Przykładowe produkty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <tr
                                    key={row.manufacturer}
                                    className={i % 2 === 0 ? 'odd' : 'even'}
                                >
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

            <div className="products-export">
                <button
                    type="button"
                    onClick={exportCsv}
                    className="btn btn-outline-secondary"
                >
                    <div
                        className="icon sprite-exel_blue mr-xs"
                        aria-hidden="true"
                    />
                    pobierz listę producentów w pliku Excel
                </button>
            </div>
        </WarehouseLayout>
    );
}
