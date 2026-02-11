'use client';

import Link from 'next/link';

type ProductDetailsTab = 'card' | 'history' | 'formulas' | 'commissions';

interface ProductDetailsTabsProps {
    productId: number;
    activeTab: ProductDetailsTab;
}

const tabList = (productId: number) => [
    {
        id: 'card' as const,
        href: `/products/${productId}`,
        label: 'karta produktu',
    },
    {
        id: 'history' as const,
        href: `/products/history/${productId}`,
        label: 'historia zmian magazynowych',
    },
    {
        id: 'formulas' as const,
        href: `/products/formulas/${productId}`,
        label: 'powiązane receptury',
    },
    {
        id: 'commissions' as const,
        href: `/products/commissions/${productId}`,
        label: 'prowizje',
    },
];

export default function ProductDetailsTabs({
    productId,
    activeTab,
}: ProductDetailsTabsProps) {
    return (
        <div className="products-detail-tabs">
            {tabList(productId).map((tab) => (
                <Link
                    key={tab.id}
                    href={tab.href}
                    className={activeTab === tab.id ? 'active' : undefined}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
