'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProductViewShell from '@/components/warehouse/ProductViewShell';
import { useProductCard, useProductHistory } from '@/hooks/useWarehouseViews';

function money(value: number | null) {
    if (value === null || value === undefined) return 'n/d';
    return `${Number(value).toFixed(2)} zł`;
}

function dateLabel(value: string) {
    try {
        return new Date(value).toLocaleDateString('pl-PL');
    } catch {
        return value;
    }
}

export default function ProductHistoryPage() {
    const router = useRouter();
    const productId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);

    const { data: card } = useProductCard(productId);
    const { data: history = [], isLoading } = useProductHistory(productId);

    return (
        <ProductViewShell
            productId={productId ?? 0}
            productLabel={card?.product?.name ?? `#${productId ?? ''}`}
            activeTab="history"
        >
            {isLoading ? (
                <p className="products-empty">Ładowanie historii...</p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table products-history-table">
                        <thead>
                            <tr>
                                <th className="px-3 py-2">typ</th>
                                <th className="px-3 py-2">ilość op.</th>
                                <th className="px-3 py-2">cena/op. netto</th>
                                <th className="px-3 py-2">cena/op. brutto</th>
                                <th className="px-3 py-2">wartość netto</th>
                                <th className="px-3 py-2">wartość brutto</th>
                                <th className="px-3 py-2">klient</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-3 py-2">
                                        {item.reference ? (
                                            <Link
                                                href={item.reference.href}
                                                className="products-link"
                                            >
                                                {item.label}{' '}
                                                {dateLabel(item.createdAt)}
                                            </Link>
                                        ) : (
                                            <>
                                                {item.label}{' '}
                                                {dateLabel(item.createdAt)}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.quantity}
                                    </td>
                                    <td className="px-3 py-2">
                                        {money(item.unitPriceNet)}
                                    </td>
                                    <td className="px-3 py-2">
                                        {money(item.unitPriceGross)}
                                    </td>
                                    <td className="px-3 py-2">
                                        {money(item.totalNet)}
                                    </td>
                                    <td className="px-3 py-2">
                                        {money(item.totalGross)}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.clientName ?? '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="products-pagination">
                        Pozycje od 1 do {history.length} | na stronie 20
                    </div>
                </div>
            )}
        </ProductViewShell>
    );
}
