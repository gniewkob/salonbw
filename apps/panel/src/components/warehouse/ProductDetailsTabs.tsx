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
        <div className="mb-5 flex flex-wrap items-center border-b border-gray-300">
            {tabList(productId).map((tab) => (
                <Link
                    key={tab.id}
                    href={tab.href}
                    className={`-mb-px border border-b-0 px-4 py-2 text-sm ${
                        activeTab === tab.id
                            ? 'bg-white text-sky-600'
                            : 'bg-gray-50 text-gray-700 hover:text-sky-600'
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
