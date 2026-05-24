'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsage } from '@/hooks/useWarehouseViews';

export default function WarehouseUsageHistoryPage() {
    const { data: usage = [], isLoading } = useWarehouseUsage('completed');
    const pageSize = 20;
    const visibleUsage = usage.slice(0, pageSize);
    const from = usage.length ? 1 : 0;
    const to = usage.length ? Math.min(pageSize, usage.length) : 0;

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
                            className="button ml-xs"
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
                    <div className="">
                        <table className="table-bordered">
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
                    <div className="pagination_container">
                        <div className="column_row">
                            <div className="row">
                                <div className="infocol-7">
                                    Pozycje od {from} do {to} z {usage.length} |
                                    na stronie 20
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </WarehouseLayout>
    );
}
