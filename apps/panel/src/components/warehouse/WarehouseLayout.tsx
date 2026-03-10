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
    icon: string;
}> = [
    {
        id: 'products',
        label: 'PRODUKTY',
        href: '/products',
        icon: 'stock_products_on',
    },
    {
        id: 'sales',
        label: 'SPRZEDAŻ',
        href: '/sales/history',
        icon: 'stock_sale',
    },
    {
        id: 'use',
        label: 'ZUŻYCIE',
        href: '/use/history',
        icon: 'stock_consumption',
    },
    {
        id: 'deliveries',
        label: 'DOSTAWY',
        href: '/deliveries/history',
        icon: 'stock_delivery',
    },
    {
        id: 'orders',
        label: 'ZAMÓWIENIA',
        href: '/orders/history',
        icon: 'stock_new_order',
    },
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

                    <div className="column_row secondary_menu">
                        <div className="pull_left">
                            <ul className="simple-list">
                                {tabConfig.map((tab) => (
                                    <li
                                        key={tab.id}
                                        className={
                                            activeTab === tab.id
                                                ? 'active'
                                                : undefined
                                        }
                                    >
                                        <Link href={tab.href}>
                                            <i
                                                className={`icon sprite-${tab.icon}`}
                                                aria-hidden="true"
                                            />{' '}
                                            {tab.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pull_right">
                            <ul className="simple-list">
                                <li
                                    className={
                                        inventoryActive ? 'active' : undefined
                                    }
                                >
                                    <Link href="/inventory">
                                        <i
                                            className="icon sprite-stock_stocktaking"
                                            aria-hidden="true"
                                        />{' '}
                                        INWENTARYZACJA
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <br className="c" />
                    </div>
                    {actions ? (
                        <div className="d-flex jc-end mb-l">{actions}</div>
                    ) : null}

                    {children}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
