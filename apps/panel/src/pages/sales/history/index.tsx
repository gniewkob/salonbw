'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';

export default function WarehouseSalesHistoryPage() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const { data: sales = [], isLoading } = useWarehouseSales();
    const pageSize = 20;

    const filteredSales = useMemo(
        () =>
            sales.filter((sale) => {
                const firstItem = sale.items?.[0]?.productName ?? '';
                const haystack =
                    `${firstItem} ${sale.saleNumber} ${sale.clientName ?? ''}`.toLowerCase();
                const matchesSearch = !search.trim()
                    ? true
                    : haystack.includes(search.toLowerCase());
                const saleType =
                    sale.totalGross < 0
                        ? 'korekta'
                        : sale.paymentMethod
                          ? 'sprzedaż'
                          : 'korekta';
                const matchesType =
                    typeFilter === 'all' ? true : saleType === typeFilter;
                return matchesSearch && matchesType;
            }),
        [sales, search, typeFilter],
    );

    const visibleSales = filteredSales.slice(0, pageSize);
    const from = filteredSales.length ? 1 : 0;
    const to = filteredSales.length
        ? Math.min(pageSize, filteredSales.length)
        : 0;

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
                <>
                    <div className="products-toolbar">
                        <input
                            type="text"
                            className="versum-input"
                            placeholder="wyszukaj w historii sprzedaży..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="versum-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">wszystkie</option>
                            <option value="sprzedaż">sprzedaż</option>
                            <option value="korekta">korekta</option>
                        </select>
                    </div>
                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>nazwa</th>
                                    <th>rodzaj</th>
                                    <th>suma brutto</th>
                                    <th>sprzedano</th>
                                    <th>pracownik</th>
                                    <th>klient</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleSales.map((sale) => {
                                    const firstItem =
                                        sale.items?.[0]?.productName ??
                                        sale.saleNumber;
                                    const saleType =
                                        sale.totalGross < 0
                                            ? 'korekta'
                                            : sale.paymentMethod
                                              ? 'sprzedaż'
                                              : 'korekta';
                                    return (
                                        <tr key={sale.id}>
                                            <td>
                                                <Link
                                                    href={`/sales/history/${sale.id}`}
                                                    className="products-link"
                                                >
                                                    {firstItem}
                                                </Link>
                                            </td>
                                            <td>{saleType}</td>
                                            <td>
                                                {Number(
                                                    sale.totalGross ?? 0,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>
                                                {new Date(
                                                    sale.soldAt,
                                                ).toLocaleDateString('pl-PL')}
                                            </td>
                                            <td>
                                                {sale.employee?.name ?? '-'}
                                            </td>
                                            <td>{sale.clientName ?? '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="products-table-footer">
                            <span>
                                Pozycje od {from} do {to} z{' '}
                                {filteredSales.length}
                            </span>
                            <div className="products-table-footer__controls">
                                <span>na stronie</span>
                                <span className="products-table-footer__page-size">
                                    {pageSize}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </WarehouseLayout>
    );
}
