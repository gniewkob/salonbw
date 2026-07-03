import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useStocktakingHistory } from '@/hooks/useWarehouseViews';

export default function InventoryHistoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
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
        <>
            <Head>
                <title>Inwentaryzacje — Salon Black &amp; White</title>
            </Head>
            <WarehouseLayout
                pageTitle="Magazyn / Inwentaryzacja | SalonBW"
                heading="Magazyn / Inwentaryzacja"
                activeTab="products"
                inventoryActive
                actions={
                    <Link href="/inventory/new" className="btn btn-primary">
                        nowa inwentaryzacja
                    </Link>
                }
            >
                <h2>HISTORIA INWENTARYZACJI</h2>
                {isLoading ? (
                    <p className="text-muted">
                        Ładowanie historii inwentaryzacji...
                    </p>
                ) : (
                    <>
                        <div className="row mb-3">
                            <div className="col-sm-7 d-flex flex-wrap gap-2 mb-2 mb-md-0">
                                <input
                                    type="text"
                                    placeholder="wyszukaj w historii inwentaryzacji..."
                                    aria-label="Wyszukaj w historii inwentaryzacji"
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                    className="form-control form-control-sm"
                                />
                            </div>
                            <div className="col-sm-5 text-end">
                                <select
                                    aria-label="Filtruj po statusie"
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
                                    <option value="completed">
                                        zakończone
                                    </option>
                                    <option value="cancelled">anulowane</option>
                                </select>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th scope="col">
                                            <div>
                                                data i nazwa inwentaryzacji
                                            </div>
                                        </th>
                                        <th scope="col">
                                            <div>status</div>
                                        </th>
                                        <th scope="col">
                                            <div>liczba produktów</div>
                                        </th>
                                        <th scope="col">
                                            <div>
                                                liczba produktów z niedoborem w
                                                magazynie
                                            </div>
                                        </th>
                                        <th scope="col">
                                            <div>
                                                liczba produktów z nadwyżką w
                                                magazynie
                                            </div>
                                        </th>
                                        <th scope="col">
                                            <div>
                                                liczba produktów ze stanem
                                                zgodnym
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRows.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <Link
                                                    href={`/inventory/${row.id}`}
                                                    className="link_body inverse_decoration"
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

                <nav className="pagination_container" aria-label="Paginacja">
                    Pozycje od {from} do {to} z {filteredRows.length} | na
                    stronie
                    <select
                        aria-label="na stronie"
                        value={String(pageSize)}
                        onChange={(event) => {
                            setPageSize(Number(event.target.value));
                            setPage(1);
                        }}
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                    <div className="form_pagination">
                        <input
                            type="text"
                            aria-label="strona"
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
                                setPage((prev) =>
                                    Math.min(prev + 1, totalPages),
                                )
                            }
                        >
                            {'>'}
                        </button>
                    </div>
                </nav>
            </WarehouseLayout>
        </>
    );
}
