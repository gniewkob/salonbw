'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useStocktakingHistory } from '@/hooks/useWarehouseViews';

export default function InventoryHistoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const statusFilter = Array.isArray(router.query.status)
        ? router.query.status[0]
        : router.query.status;
    const normalizedStatus =
        statusFilter === 'draft' ||
        statusFilter === 'in_progress' ||
        statusFilter === 'completed' ||
        statusFilter === 'cancelled'
            ? statusFilter
            : undefined;
    const { data: rows = [], isLoading } =
        useStocktakingHistory(normalizedStatus);
    const statusLabels: Record<
        'draft' | 'in_progress' | 'completed' | 'cancelled',
        string
    > = {
        draft: 'robocza',
        in_progress: 'w toku',
        completed: 'zakończona',
        cancelled: 'anulowana',
    };
    const filteredRows = useMemo(
        () =>
            rows.filter((row) => {
                if (!search.trim()) return true;
                const haystack =
                    `${row.stocktakingNumber} ${row.status} ${row.stocktakingDate}`.toLowerCase();
                return haystack.includes(search.toLowerCase());
            }),
        [rows, search],
    );
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize);
    const from = filteredRows.length ? startIndex + 1 : 0;
    const to = filteredRows.length
        ? Math.min(startIndex + pageSize, filteredRows.length)
        : 0;

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
                <>
                    <div className="products-toolbar">
                        <input
                            type="text"
                            className="versum-input"
                            placeholder="wyszukaj w historii inwentaryzacji..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                        <select
                            className="versum-select"
                            value={normalizedStatus ?? ''}
                            onChange={(event) => {
                                const status = event.target.value;
                                setPage(1);
                                void router.push({
                                    pathname: '/inventory',
                                    query: status ? { status } : {},
                                });
                            }}
                        >
                            <option value="">wszystkie</option>
                            <option value="draft">robocze</option>
                            <option value="in_progress">w toku</option>
                            <option value="completed">zakończone</option>
                            <option value="cancelled">anulowane</option>
                        </select>
                    </div>
                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>data i nazwa inwentaryzacji</th>
                                    <th>status</th>
                                    <th>liczba produktów</th>
                                    <th>
                                        liczba produktów z niedoborem w
                                        magazynie
                                    </th>
                                    <th>
                                        liczba produktów z nadwyżką w magazynie
                                    </th>
                                    <th>liczba produktów ze stanem zgodnym</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <Link
                                                href={`/inventory/${row.id}`}
                                                className="products-link"
                                            >
                                                {new Date(
                                                    row.stocktakingDate,
                                                ).toLocaleDateString(
                                                    'pl-PL',
                                                )}{' '}
                                                {row.stocktakingNumber}
                                            </Link>
                                        </td>
                                        <td>{statusLabels[row.status]}</td>
                                        <td>{row.productsCount}</td>
                                        <td>{row.shortageCount}</td>
                                        <td>{row.overageCount}</td>
                                        <td>{row.matchedCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <div className="products-pagination">
                Pozycje od {from} do {to} z {filteredRows.length} | na stronie
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
                        onChange={(event) => {
                            const next = Number(event.target.value);
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
                            setPage((prev) => Math.min(prev + 1, totalPages))
                        }
                    >
                        {'>'}
                    </button>
                </div>
            </div>
        </WarehouseLayout>
    );
}
