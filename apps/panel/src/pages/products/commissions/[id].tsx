'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ProductViewShell from '@/components/warehouse/ProductViewShell';
import {
    useProductCard,
    useProductCommissions,
    useUpdateProductCommissions,
} from '@/hooks/useWarehouseViews';

export default function ProductCommissionsPage() {
    const router = useRouter();
    const productId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);

    const { data: card } = useProductCard(productId);
    const { data: rules = [], isLoading } = useProductCommissions(productId);
    const updateMutation = useUpdateProductCommissions(productId);
    const [edited, setEdited] = useState<Record<number, string>>({});

    const save = async () => {
        if (!rules) return;
        const payload = rules.map((rule) => ({
            ...rule,
            commissionPercent: Number(
                edited[rule.employeeId] ?? rule.commissionPercent ?? 0,
            ),
        }));
        await updateMutation.mutateAsync(payload);
        setEdited({});
    };

    return (
        <ProductViewShell
            productId={productId ?? 0}
            productLabel={card?.product?.name ?? `#${productId ?? ''}`}
            activeTab="commissions"
        >
            {isLoading ? (
                <p className="products-empty">Ładowanie prowizji...</p>
            ) : (
                <div className="products-commissions">
                    <h2>Prowizje</h2>
                    <ol>
                        {rules.map((rule) => (
                            <li key={rule.employeeId}>
                                {rule.employeeName} (prowizja:{' '}
                                <input
                                    type="number"
                                    className="form-control products-commissions__input"
                                    value={
                                        edited[rule.employeeId] ??
                                        rule.commissionPercent
                                    }
                                    onChange={(event) =>
                                        setEdited((prev) => ({
                                            ...prev,
                                            [rule.employeeId]:
                                                event.target.value,
                                        }))
                                    }
                                />
                                %)
                            </li>
                        ))}
                    </ol>
                    <div className="products-commissions__actions">
                        <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => void save()}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending
                                ? 'zapisywanie...'
                                : 'zapisz prowizje'}
                        </button>
                    </div>
                </div>
            )}
        </ProductViewShell>
    );
}
