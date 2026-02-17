'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsage } from '@/hooks/useWarehouseViews';

export default function WarehouseUsagePlannedPage() {
    const { data: usage = [], isLoading } = useWarehouseUsage('planned');
    const pageSize = 20;
    const visibleUsage = usage.slice(0, pageSize);
    const from = usage.length ? 1 : 0;
    const to = usage.length ? Math.min(pageSize, usage.length) : 0;

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Planowane zużycie | SalonBW"
            heading="Magazyn / Planowane zużycie"
            activeTab="use"
            actions={
                <>
                    <Link
                        href="/use/new?scope=planned"
                        className="btn btn-primary btn-xs"
                    >
                        dodaj planowane zużycie
                    </Link>
                    <Link
                        href="/use/history"
                        className="btn btn-default btn-xs"
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
        </WarehouseLayout>
    );
}
