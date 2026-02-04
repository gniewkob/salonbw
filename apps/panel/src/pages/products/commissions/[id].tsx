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
                <p className="py-6 text-sm text-gray-500">
                    Ładowanie prowizji...
                </p>
            ) : (
                <div>
                    <h2 className="mb-3 text-[44px] leading-none text-gray-800">
                        Prowizje
                    </h2>
                    <ol className="space-y-2 text-base text-gray-700">
                        {rules.map((rule) => (
                            <li key={rule.employeeId}>
                                {rule.employeeName} (prowizja:{' '}
                                <input
                                    type="number"
                                    className="mx-1 w-20 rounded border border-gray-300 px-1 py-0.5 text-sm"
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
                    <div className="mt-4">
                        <button
                            type="button"
                            className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600 disabled:opacity-60"
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
