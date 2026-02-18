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

const inventoryStatusLabel: Record<
    'draft' | 'in_progress' | 'completed' | 'cancelled',
    string
> = {
    draft: 'robocza',
    in_progress: 'w toku',
    completed: 'zakończona',
    cancelled: 'anulowana',
};

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
                <div className="btn-group">
                    <Link href="/inventory" className="btn btn-default btn-xs">
                        historia inwentaryzacji
                    </Link>
                    {data?.status === 'draft' ? (
                        <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => void start()}
                        >
                            rozpocznij
                        </button>
                    ) : null}
                    {data?.status === 'in_progress' ? (
                        <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => void complete()}
                        >
                            zakończ
                        </button>
                    ) : null}
                </div>
            }
        >
            {isLoading || !data ? (
                <p className="products-empty">Ładowanie inwentaryzacji...</p>
            ) : (
                <div className="warehouse-new-screen">
                    <h3 className="warehouse-subtitle">
                        Szczegóły inwentaryzacji
                    </h3>
                    <div className="warehouse-form-card">
                        <div className="warehouse-meta-grid">
                            <div>
                                numer: <strong>{data.stocktakingNumber}</strong>
                            </div>
                            <div>
                                status:{' '}
                                <strong>
                                    {inventoryStatusLabel[data.status]}
                                </strong>
                            </div>
                            <div>
                                data:{' '}
                                <strong>
                                    {new Date(
                                        data.stocktakingDate,
                                    ).toLocaleDateString('pl-PL')}
                                </strong>
                            </div>
                            <div>
                                pozycji: <strong>{data.items.length}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="products-table-wrap warehouse-lines-table">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>produkt</th>
                                    <th>stan systemowy</th>
                                    <th>stan policzony</th>
                                    <th>różnica</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            {item.product?.name ??
                                                `#${item.productId}`}
                                        </td>
                                        <td>{item.systemQuantity}</td>
                                        <td>
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
                                                    className="form-control"
                                                />
                                            ) : (
                                                (item.countedQuantity ?? '-')
                                            )}
                                        </td>
                                        <td>{item.difference ?? '-'}</td>
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
