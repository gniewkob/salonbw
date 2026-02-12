'use client';

import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import SuppliersTab from '@/components/warehouse/SuppliersTab';

export default function WarehouseSuppliersPage() {
    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dostawcy | SalonBW"
            heading="Magazyn / Dostawcy"
            activeTab="deliveries"
        >
            <SuppliersTab />
        </WarehouseLayout>
    );
}
