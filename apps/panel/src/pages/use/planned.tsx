'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';

export default function WarehouseUsagePlannedPage() {
    return (
        <WarehouseLayout
            pageTitle="Magazyn / Planowane zużycie | SalonBW"
            heading="Magazyn / Planowane zużycie"
            activeTab="use"
            actions={
                <>
                    <Link href="/use/new" className="btn btn-default btn-xs">
                        dodaj zużycie
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
            <p className="products-empty">Brak planowanego zużycia.</p>
        </WarehouseLayout>
    );
}
