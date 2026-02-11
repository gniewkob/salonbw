'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';

type WarehouseMainTab = 'products' | 'sales' | 'use' | 'deliveries' | 'orders';

const tabConfig: Array<{
    id: WarehouseMainTab;
    label: string;
    href: string;
}> = [
    { id: 'products', label: 'Produkty', href: '/products' },
    { id: 'sales', label: 'Sprzedaż', href: '/sales/new' },
    { id: 'use', label: 'Zużycie', href: '/use/new' },
    { id: 'deliveries', label: 'Dostawy', href: '/deliveries/new' },
    { id: 'orders', label: 'Zamówienia', href: '/orders/new' },
];

interface WarehouseLayoutProps {
    pageTitle: string;
    heading: string;
    breadcrumb?: string;
    activeTab: WarehouseMainTab;
    inventoryActive?: boolean;
    actions?: ReactNode;
    children: ReactNode;
}

export default function WarehouseLayout({
    pageTitle,
    heading,
    activeTab,
    inventoryActive = false,
    actions,
    children,
}: WarehouseLayoutProps) {
    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <VersumCustomersVendorCss />
            <DashboardLayout>
                <div className="products_index" id="products_main">
                    <header className="products-header">
                        <h1>{heading}</h1>
                    </header>

                    <div className="products-top-tabs">
                        <nav>
                            {tabConfig.map((tab) => (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={
                                        activeTab === tab.id ? 'active' : ''
                                    }
                                >
                                    {tab.label}
                                </Link>
                            ))}
                            <Link
                                href="/inventory"
                                className={`${inventoryActive ? 'active' : ''} products-top-tabs__right`}
                            >
                                Inwentaryzacja
                            </Link>
                        </nav>
                        {actions ? (
                            <div className="products-toolbar__actions">
                                {actions}
                            </div>
                        ) : null}
                    </div>

                    {children}
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
