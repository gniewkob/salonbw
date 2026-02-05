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
    breadcrumb,
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
                <div className="rounded border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-4">
                        <h1 className="text-[34px] leading-none font-semibold text-gray-500">
                            {heading}
                        </h1>
                        {breadcrumb ? (
                            <p className="mt-2 text-sm text-gray-500">
                                {breadcrumb}
                            </p>
                        ) : null}
                        <div className="mt-5 flex items-center justify-between">
                            <nav className="flex items-center gap-5">
                                {tabConfig.map((tab) => (
                                    <Link
                                        key={tab.id}
                                        href={tab.href}
                                        className={`border-b-2 pb-2 text-[12px] font-semibold uppercase tracking-wide ${
                                            activeTab === tab.id
                                                ? 'border-sky-500 text-sky-500'
                                                : 'border-transparent text-gray-700 hover:text-sky-500'
                                        }`}
                                    >
                                        {tab.label}
                                    </Link>
                                ))}
                            </nav>
                            <Link
                                href="/inventory"
                                className={`border-b-2 pb-2 text-[12px] font-semibold uppercase tracking-wide ${
                                    inventoryActive
                                        ? 'border-sky-500 text-sky-500'
                                        : 'border-transparent text-gray-700 hover:text-sky-500'
                                }`}
                            >
                                Inwentaryzacja
                            </Link>
                        </div>
                    </div>
                    {actions ? (
                        <div className="px-4 py-3 text-right">{actions}</div>
                    ) : null}
                    <div className="p-4">{children}</div>
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
