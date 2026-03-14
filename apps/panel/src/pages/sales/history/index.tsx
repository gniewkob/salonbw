'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';
import type { WarehouseSale } from '@/types';

const formatCurrency = (value: number) =>
    `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)} zł`;

function saleKindLabel(sale: WarehouseSale) {
    switch (sale.kind) {
        case 'void':
            return 'void';
        case 'refund':
            return 'zwrot';
        case 'correction':
            return 'korekta';
        default:
            return 'sprzedaż';
    }
}

const PAGE_SIZE = 20;

export default function WarehouseSalesHistoryPage() {
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [kindFilter, setKindFilter] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => setSearchDebounced(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading } = useWarehouseSales({
        page,
        pageSize: PAGE_SIZE,
        search: searchDebounced || undefined,
        kind: kindFilter || undefined,
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const from = total ? (safePage - 1) * PAGE_SIZE + 1 : 0;
    const to = total ? Math.min(safePage * PAGE_SIZE, total) : 0;

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
                            value={kindFilter}
                            onChange={(e) => {
                                setKindFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">wszystkie</option>
                            <option value="sale">sprzedaż</option>
                            <option value="void">void</option>
                            <option value="refund">zwrot</option>
                            <option value="correction">korekta</option>
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
                                {items.map((sale) => {
                                    const firstItem =
                                        sale.items?.[0]?.productName ??
                                        sale.saleNumber;
                                    const saleType = saleKindLabel(sale);
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
                                Pozycje od {from} do {to} z {total}
                            </span>
                            <div className="products-table-footer__controls">
                                <span>na stronie</span>
                                <select
                                    className="versum-select versum-select--inline"
                                    value={String(PAGE_SIZE)}
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
