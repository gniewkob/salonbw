'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
import { useAuth } from '@/contexts/AuthContext';

type WarehouseMainTab = 'products' | 'sales' | 'use' | 'deliveries' | 'orders';

const tabConfig: Array<{
    id: WarehouseMainTab;
    label: string;
    href: string;
}> = [
    { id: 'products', label: 'Produkty', href: '/products' },
    { id: 'sales', label: 'Sprzedaż', href: '/sales/history' },
    { id: 'use', label: 'Zużycie', href: '/use/history' },
    { id: 'deliveries', label: 'Dostawy', href: '/deliveries/history' },
    { id: 'orders', label: 'Zamówienia', href: '/orders/history' },
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
    const { role } = useAuth();
    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <VersumCustomersVendorCss />
            <VersumShell role={role}>
                <div className="products_index" id="products_main">
                    <ul className="breadcrumb">
                        <li>{heading}</li>
                    </ul>

                    <div className="products-top-tabs">
                        {tabConfig.map((tab) => (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={activeTab === tab.id ? 'active' : ''}
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
                        {actions ? (
                            <div className="products-toolbar__actions">
                                {actions}
                            </div>
                        ) : null}
                    </div>

                    {children}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
