'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';

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
    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <DashboardLayout>
                <div className="versum-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">{heading}</h1>
                    </header>

                    <div className="versum-page__toolbar">
                        <nav className="flex items-center gap-4">
                            {tabConfig.map((tab) => (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={`border-b-2 pb-1 text-[11px] font-semibold uppercase tracking-wide ${
                                        activeTab === tab.id
                                            ? 'border-sky-500 text-sky-500'
                                            : 'border-transparent text-gray-600 hover:text-sky-500'
                                    }`}
                                >
                                    {tab.label}
                                </Link>
                            ))}
                            <Link
                                href="/inventory"
                                className={`border-b-2 pb-1 text-[11px] font-semibold uppercase tracking-wide ml-auto ${
                                    inventoryActive
                                        ? 'border-sky-500 text-sky-500'
                                        : 'border-transparent text-gray-600 hover:text-sky-500'
                                }`}
                            >
                                Inwentaryzacja
                            </Link>
                        </nav>
                        {actions ? (
                            <div className="ml-auto flex items-center gap-2">
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
