'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useStocktaking,
    useStartStocktaking,
    useCompleteStocktaking,
    useUpdateStocktakingItem,
} from '@/hooks/useWarehouse';

export default function InventoryDetailsPage() {
    const router = useRouter();
    const stocktakingId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);

    const { data, isLoading } = useStocktaking(stocktakingId ?? null);
    const startMutation = useStartStocktaking();
    const completeMutation = useCompleteStocktaking();
    const updateItemMutation = useUpdateStocktakingItem();

    const start = async () => {
        if (!stocktakingId) return;
        await startMutation.mutateAsync(stocktakingId);
    };

    const complete = async () => {
        if (!stocktakingId) return;
        await completeMutation.mutateAsync({
            id: stocktakingId,
            applyDifferences: true,
        });
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Inwentaryzacja szczegóły | SalonBW"
            heading={`Magazyn / Inwentaryzacja / ${data?.stocktakingNumber ?? ''}`}
            activeTab="products"
            inventoryActive
            actions={
                <div className="flex justify-end gap-2">
                    <Link
                        href="/inventory"
                        className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                    >
                        historia inwentaryzacji
                    </Link>
                    {data?.status === 'draft' ? (
                        <button
                            type="button"
                            className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                            onClick={() => void start()}
                        >
                            rozpocznij
                        </button>
                    ) : null}
                    {data?.status === 'in_progress' ? (
                        <button
                            type="button"
                            className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                            onClick={() => void complete()}
                        >
                            zakończ
                        </button>
                    ) : null}
                </div>
            }
        >
            {isLoading || !data ? (
                <p className="py-8 text-sm text-gray-500">
                    Ładowanie inwentaryzacji...
                </p>
            ) : (
                <div className="space-y-4">
                    <div className="text-sm text-gray-700">
                        status: <strong>{data.status}</strong> | data:{' '}
                        {new Date(data.stocktakingDate).toLocaleDateString(
                            'pl-PL',
                        )}
                    </div>
                    <div className="overflow-x-auto border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                                <tr>
                                    <th className="px-3 py-2">produkt</th>
                                    <th className="px-3 py-2">
                                        stan systemowy
                                    </th>
                                    <th className="px-3 py-2">
                                        stan policzony
                                    </th>
                                    <th className="px-3 py-2">różnica</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-gray-200 hover:bg-gray-50"
                                    >
                                        <td className="px-3 py-2">
                                            {item.product?.name ??
                                                `#${item.productId}`}
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.systemQuantity}
                                        </td>
                                        <td className="px-3 py-2">
                                            {data.status === 'in_progress' ? (
                                                <input
                                                    type="number"
                                                    value={
                                                        item.countedQuantity ??
                                                        ''
                                                    }
                                                    onChange={(event) =>
                                                        void updateItemMutation.mutateAsync(
                                                            {
                                                                stocktakingId:
                                                                    data.id,
                                                                itemId: item.id,
                                                                data: {
                                                                    countedQuantity:
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value ||
                                                                                0,
                                                                        ),
                                                                },
                                                            },
                                                        )
                                                    }
                                                    className="w-24 rounded border border-gray-300 px-2 py-1.5"
                                                />
                                            ) : (
                                                (item.countedQuantity ?? '-')
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.difference ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </WarehouseLayout>
    );
}
