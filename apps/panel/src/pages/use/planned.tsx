import { useState } from 'react';
import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsage } from '@/hooks/useWarehouseViews';

export default function WarehouseUsagePlannedPage() {
    const { data: usage = [], isLoading } = useWarehouseUsage('planned');
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
            pageTitle="Magazyn / Planowane zużycie | SalonBW"
            heading="Magazyn / Planowane zużycie"
            activeTab="use"
            actions={
                <>
                    <Link
                        href="/use/new?scope=planned"
                        className="btn btn-primary btn-sm"
                    >
                        dodaj planowane zużycie
                    </Link>
                    <Link
                        href="/use/history"
                        className="btn btn-outline-secondary btn-sm"
                    >
                        historia zużycia
                    </Link>
                </>
            }
        >
            <h2 className="warehouse-section-title">PLANOWANE ZUŻYCIE</h2>
            {isLoading ? (
                <p className="products-empty">
                    Ładowanie planowanego zużycia...
                </p>
            ) : usage.length === 0 ? (
                <p className="products-empty">Brak planowanego zużycia.</p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>nr zużycia</th>
                                <th>data planowana</th>
                                <th>klient</th>
                                <th>pracownik</th>
                                <th>pozycje</th>
                                <th>szczegóły</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleUsage.map((entry) => (
                                <tr key={entry.id}>
                                    <td>{entry.usageNumber}</td>
                                    <td>
                                        {new Date(entry.usedAt).toLocaleString(
                                            'pl-PL',
                                        )}
                                    </td>
                                    <td>{entry.clientName ?? '-'}</td>
                                    <td>{entry.employee?.name ?? '-'}</td>
                                    <td>{entry.summary?.totalItems ?? 0}</td>
                                    <td>
                                        <Link
                                            href={`/use/history/${entry.id}`}
                                            className="products-link"
                                        >
                                            otwórz
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="products-table-footer">
                        <span>
                            Pozycje od {from} do {to} z {usage.length}
                        </span>
                        <div className="products-table-footer__controls">
                            <span>na stronie</span>
                            <span className="products-table-footer__page-size">
                                {pageSize}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            <div className="products-export">
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                        const header = [
                            'Nr zużycia',
                            'Data planowana',
                            'Klient',
                            'Pracownik',
                            'Liczba pozycji',
                        ];
                        const rows = usage.map((entry) => [
                            entry.usageNumber,
                            new Date(entry.usedAt).toLocaleDateString('pl-PL'),
                            entry.clientName ?? '',
                            entry.employee?.name ?? '',
                            String(entry.summary?.totalItems ?? 0),
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
                        a.download = 'planowane-zuzycie.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    <div
                        className="icon sprite-exel_blue mr-xs"
                        aria-hidden="true"
                    />
                    pobierz planowane zużycie w pliku Excel
                </button>
            </div>
            <div className="pagination_container">
                <div className="column_row">
                    <div className="row">
                        <div className="infocol-7">
                            Pozycje od {from} do {to} z {usage.length} | na
                            stronie 20
                        </div>
                        <div className="form_paginationcol-5">
                            <input
                                type="text"
                                className="pagination-page-input"
                                aria-label="strona"
                                value={safePage}
                                readOnly
                            />
                            {' z '}
                            <a className="pointer">{totalPages}</a>
                            <button
                                type="button"
                                className="btn btn-link button_next ml-s"
                                aria-label="Następna strona"
                                disabled={safePage >= totalPages}
                                onClick={() =>
                                    setPage((p) => Math.min(p + 1, totalPages))
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
        </WarehouseLayout>
    );
}
