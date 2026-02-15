'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsage } from '@/hooks/useWarehouseViews';

export default function WarehouseUsageHistoryPage() {
    const { data: usage = [], isLoading } = useWarehouseUsage('completed');

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia zużycia | SalonBW"
            heading="Magazyn / Historia zużycia"
            activeTab="use"
            actions={
                <>
                    <Link href="/use/new" className="btn btn-primary btn-xs">
                        dodaj zużycie
                    </Link>
                    <Link
                        href="/use/new?scope=planned"
                        className="btn btn-default btn-xs"
                    >
                        dodaj planowane zużycie
                    </Link>
                </>
            }
        >
            {isLoading ? (
                <p className="products-empty">Ładowanie historii zużycia...</p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
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
                            {usage.map((entry) => (
                                <tr key={entry.id}>
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
                                                    Number(item.quantity ?? 0),
                                                0,
                                            ) ??
                                            0}
                                    </td>
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
