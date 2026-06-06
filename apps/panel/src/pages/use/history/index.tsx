import { useState } from 'react';
import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsage } from '@/hooks/useWarehouseViews';

export default function WarehouseUsageHistoryPage() {
    const { data: usage = [], isLoading } = useWarehouseUsage('completed');
    const pageSize = 20;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(usage.length / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const visibleUsage = usage.slice(startIndex, startIndex + pageSize);
    const from = usage.length ? startIndex + 1 : 0;
    const to = usage.length ? Math.min(startIndex + pageSize, usage.length) : 0;

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia zużycia | SalonBW"
            heading="Magazyn / Historia zużycia"
            activeTab="use"
        >
            <div className="row mb-3">
                <div className="col-sm-12">
                    <div className="d-flex flex-wrap justify-content-end">
                        <Link href="/use/new" className="btn btn-primary ml-xs">
                            dodaj zużycie
                        </Link>
                        <Link
                            href="/use/new?scope=planned"
                            className="btn btn-outline-secondary btn-sm ml-xs"
                        >
                            dodaj planowane zużycie
                        </Link>
                    </div>
                </div>
            </div>
            {isLoading ? (
                <p className="text-muted">Ładowanie historii zużycia...</p>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>nr zużycia</th>
                                    <th>data</th>
                                    <th>klient</th>
                                    <th>pracownik</th>
                                    <th>pozycje</th>
                                    <th>szczegóły</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleUsage.map((entry, i) => (
                                    <tr
                                        key={entry.id}
                                        className={i % 2 === 0 ? 'odd' : 'even'}
                                    >
                                        <td>{entry.usageNumber}</td>
                                        <td>
                                            {new Date(
                                                entry.usedAt,
                                            ).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td>{entry.clientName ?? '-'}</td>
                                        <td>{entry.employee?.name ?? '-'}</td>
                                        <td>
                                            {entry.summary?.totalItems ??
                                                entry.items?.reduce(
                                                    (sum, item) =>
                                                        sum +
                                                        Number(
                                                            item.quantity ?? 0,
                                                        ),
                                                    0,
                                                ) ??
                                                0}
                                        </td>
                                        <td className="wrap blue_text pointer link_body">
                                            <Link
                                                href={`/use/history/${entry.id}`}
                                            >
                                                otwórz
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="products-export">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                const header = [
                                    'Nr zużycia',
                                    'Data',
                                    'Klient',
                                    'Pracownik',
                                    'Liczba pozycji',
                                ];
                                const rows = usage.map((entry) => [
                                    entry.usageNumber,
                                    new Date(entry.usedAt).toLocaleDateString(
                                        'pl-PL',
                                    ),
                                    entry.clientName ?? '',
                                    entry.employee?.name ?? '',
                                    String(
                                        entry.summary?.totalItems ??
                                            entry.items?.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    Number(item.quantity ?? 0),
                                                0,
                                            ) ??
                                            0,
                                    ),
                                ]);
                                const csv = [header, ...rows]
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
                                a.download = 'historia-zuzycia.csv';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            <div
                                className="icon sprite-exel_blue mr-xs"
                                aria-hidden="true"
                            />
                            pobierz historię zużycia w pliku Excel
                        </button>
                    </div>
                    <div className="pagination_container">
                        <div className="column_row">
                            <div className="row">
                                <div className="infocol-7">
                                    Pozycje od {from} do {to} z {usage.length} |
                                    na stronie 20
                                </div>
                                <div className="form_paginationcol-5">
                                    <input
                                        type="text"
                                        className="pagination-page-input"
                                        aria-label="strona"
                                        value={safePage}
                                        onChange={(event) => {
                                            const next = Number(
                                                event.target.value,
                                            );
                                            if (
                                                Number.isFinite(next) &&
                                                next >= 1 &&
                                                next <= totalPages
                                            ) {
                                                setPage(next);
                                            }
                                        }}
                                    />
                                    {' z '}
                                    <a className="pointer">{totalPages}</a>
                                    <button
                                        type="button"
                                        className="btn btn-link button_next ml-s"
                                        aria-label="Następna strona"
                                        disabled={safePage >= totalPages}
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(p + 1, totalPages),
                                            )
                                        }
                                    >
                                        <span
                                            className="fc-icon fc-icon-right-single-arrow"
                                            aria-hidden="true"
                                        />
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
