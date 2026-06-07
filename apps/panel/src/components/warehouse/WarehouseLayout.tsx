import type { ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

type WarehouseMainTab = 'products' | 'sales' | 'use' | 'inventory';

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
        id: 'inventory',
        label: 'INWENTARYZACJA',
        href: '/inventory',
        icon: 'stock_stocktaking',
    },
];

interface WarehouseLayoutProps {
    pageTitle: string;
    heading: string;
    breadcrumb?: string;
    activeTab: WarehouseMainTab;
    /** @deprecated use activeTab="inventory" instead */
    inventoryActive?: boolean;
    actions?: ReactNode;
    children: ReactNode;
}

export default function WarehouseLayout({
    pageTitle,
    heading,
    activeTab: activeTabProp,
    inventoryActive = false,
    actions,
    children,
}: WarehouseLayoutProps) {
    const activeTab = inventoryActive ? 'inventory' : activeTabProp;
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <SalonShell role={role}>
                <div className="products_index" id="products_main">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_stock"
                        items={[
                            { label: 'Magazyn', href: '/products' },
                            { label: heading.replace(/^Magazyn\s*\/\s*/, '') },
                        ]}
                    />

                    <div className="column_row secondary_menu">
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
                    {actions ? (
                        <div className="d-flex justify-content-end mb-3">
                            {actions}
                        </div>
                    ) : null}

                    {children}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
