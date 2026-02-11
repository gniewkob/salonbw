'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProductViewShell from '@/components/warehouse/ProductViewShell';
import { useProductCard, useProductFormulas } from '@/hooks/useWarehouseViews';

export default function ProductFormulasPage() {
    const router = useRouter();
    const productId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);

    const { data: card } = useProductCard(productId);
    const { data: formulas = [], isLoading } = useProductFormulas(productId);

    return (
        <ProductViewShell
            productId={productId ?? 0}
            productLabel={card?.product?.name ?? `#${productId ?? ''}`}
            activeTab="formulas"
        >
            {isLoading ? (
                <p className="products-empty">Ładowanie receptur...</p>
            ) : formulas.length === 0 ? (
                <p className="products-empty">
                    Brak receptur dla tego produktu
                </p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table products-formulas-table">
                        <thead>
                            <tr>
                                <th className="px-3 py-2">Usługa</th>
                                <th className="px-3 py-2">Wariant</th>
                                <th className="px-3 py-2">Ilość</th>
                                <th className="px-3 py-2">Jednostka</th>
                                <th className="px-3 py-2">Notatki</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formulas.map((formula) => (
                                <tr key={formula.id}>
                                    <td className="px-3 py-2">
                                        <Link
                                            href={`/admin/services/${formula.serviceId}`}
                                            className="products-link"
                                        >
                                            {formula.serviceName ??
                                                `Usługa #${formula.serviceId}`}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2">
                                        {formula.serviceVariantName ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {formula.quantity}
                                    </td>
                                    <td className="px-3 py-2">
                                        {formula.unit ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {formula.notes ?? '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ProductViewShell>
    );
}
