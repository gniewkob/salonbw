'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';

const formatCurrency = (value: number) =>
    `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)} zł`;

export default function WarehouseSalesHistoryPage() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const { data: sales = [], isLoading } = useWarehouseSales();

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

    const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const visibleSales = filteredSales.slice(startIndex, startIndex + pageSize);
    const from = filteredSales.length ? startIndex + 1 : 0;
    const to = filteredSales.length
        ? Math.min(startIndex + pageSize, filteredSales.length)
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
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                        <select
                            className="versum-select"
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
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
                                                {formatCurrency(
                                                    Number(
                                                        sale.totalGross ?? 0,
                                                    ),
                                                )}
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
                                <select
                                    className="versum-select versum-select--inline"
                                    value={String(pageSize)}
                                    disabled
                                >
                                    <option value="20">20</option>
                                </select>
                                <div className="products-pagination-nav">
                                    <input
                                        type="text"
                                        value={safePage}
                                        onChange={(e) => {
                                            const next = Number(e.target.value);
                                            if (
                                                Number.isFinite(next) &&
                                                next >= 1 &&
                                                next <= totalPages
                                            ) {
                                                setPage(next);
                                            }
                                        }}
                                    />
                                    <span>z {totalPages}</span>
                                    <button
                                        type="button"
                                        disabled={safePage >= totalPages}
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.min(prev + 1, totalPages),
                                            )
                                        }
                                    >
                                        {'>'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </WarehouseLayout>
    );
}
