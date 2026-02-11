'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import WarehouseLayout from './WarehouseLayout';
import ProductDetailsTabs from './ProductDetailsTabs';

type ProductViewTab = 'card' | 'history' | 'formulas' | 'commissions';

interface ProductViewShellProps {
    productId: number;
    productLabel: string;
    activeTab: ProductViewTab;
    children: ReactNode;
}

export default function ProductViewShell({
    productId,
    productLabel,
    activeTab,
    children,
}: ProductViewShellProps) {
    const actions = (
        <div className="products-card-actions">
            <Link href="/sales/new" className="btn btn-default btn-xs">
                sprzedaj
            </Link>
            <Link href="/use/new" className="btn btn-default btn-xs">
                zużyj
            </Link>
            <Link
                href={`/products/${productId}/edit`}
                className="btn btn-default btn-xs"
            >
                edytuj
            </Link>
            <Link href="/products/new" className="btn btn-primary btn-xs">
                dodaj produkt
            </Link>
        </div>
    );

    return (
        <WarehouseLayout
            pageTitle={`Magazyn / Produkty / ${productLabel} | SalonBW`}
            heading={`Magazyn / Produkty / ${productLabel}`}
            activeTab="products"
            actions={actions}
        >
            <ProductDetailsTabs productId={productId} activeTab={activeTab} />
            {children}
        </WarehouseLayout>
    );
}
