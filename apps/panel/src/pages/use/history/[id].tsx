'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseUsageEntry } from '@/hooks/useWarehouseViews';

export default function WarehouseUsageDetailsPage() {
    const router = useRouter();
    const usageId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);
    const { data, isLoading } = useWarehouseUsageEntry(usageId);

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Szczegóły zużycia | SalonBW"
            heading={`Magazyn / Historia zużycia / ${data?.usageNumber ?? ''}`}
            activeTab="use"
            actions={
                <Link href="/use/history" className="btn btn-default btn-xs">
                    historia zużycia
                </Link>
            }
        >
            {isLoading || !data ? (
                <p className="products-empty">
                    Ładowanie szczegółów zużycia...
                </p>
            ) : (
                <div>
                    <h2 className="warehouse-section-title">
                        Szczegóły zużycia
                    </h2>
                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>nazwa</th>
                                    <th>ilość</th>
                                    <th>stan przed</th>
                                    <th>stan po</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.productName}</td>
                                        <td>
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td>{item.stockBefore}</td>
                                        <td>{item.stockAfter}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </WarehouseLayout>
    );
}
