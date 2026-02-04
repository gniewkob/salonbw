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
        <div className="flex flex-wrap justify-end gap-2">
            <Link
                href="/sales/new"
                className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
            >
                sprzedaj
            </Link>
            <Link
                href="/use/new"
                className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
            >
                zużyj
            </Link>
            <Link
                href={`/products/${productId}`}
                className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
            >
                więcej
            </Link>
            <Link
                href="/products"
                className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
            >
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
