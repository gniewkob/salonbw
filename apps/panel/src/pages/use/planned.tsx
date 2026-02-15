'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsage } from '@/hooks/useWarehouseViews';

export default function WarehouseUsagePlannedPage() {
    const { data: usage = [], isLoading } = useWarehouseUsage('planned');

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
                            {usage.map((entry) => (
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
                </div>
            )}
        </WarehouseLayout>
    );
}
