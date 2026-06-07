import Head from 'next/head';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import SuppliersTab from '@/components/warehouse/SuppliersTab';

export default function WarehouseSuppliersPage() {
    return (
        <>
            <Head>
                <title>Dostawcy — Salon Black &amp; White</title>
            </Head>
            <WarehouseLayout
                pageTitle="Magazyn / Dostawcy | SalonBW"
                heading="Magazyn / Dostawcy"
                activeTab="products"
            >
                <SuppliersTab />
            </WarehouseLayout>
        </>
    );
}
