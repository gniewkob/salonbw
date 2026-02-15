'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCancelDelivery,
    useDelivery,
    useReceiveDelivery,
} from '@/hooks/useWarehouse';

const deliveryStatusLabel: Record<string, string> = {
    draft: 'robocza',
    pending: 'oczekująca',
    received: 'przyjęta',
    cancelled: 'anulowana',
};

export default function DeliveryDetailsPage() {
    const router = useRouter();
    const deliveryId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : null;
    }, [router.query.id]);

    const { data: delivery, isLoading } = useDelivery(deliveryId);
    const receiveMutation = useReceiveDelivery();
    const cancelMutation = useCancelDelivery();

    const receive = async () => {
        if (!deliveryId) return;
        await receiveMutation.mutateAsync({ id: deliveryId });
    };

    const cancel = async () => {
        if (!deliveryId) return;
        await cancelMutation.mutateAsync(deliveryId);
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Szczegóły dostawy | SalonBW"
            heading={`Magazyn / Historia dostaw / ${delivery?.deliveryNumber ?? ''}`}
            activeTab="deliveries"
            actions={
                <div className="btn-group">
                    <Link
                        href="/deliveries/history"
                        className="btn btn-default btn-xs"
                    >
                        historia dostaw
                    </Link>
                    {delivery?.status === 'draft' ||
                    delivery?.status === 'pending' ? (
                        <>
                            <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={() => void receive()}
                            >
                                przyjmij dostawę
                            </button>
                            <button
                                type="button"
                                className="btn btn-default btn-xs"
                                onClick={() => void cancel()}
                            >
                                anuluj
                            </button>
                        </>
                    ) : null}
                </div>
            }
        >
            {isLoading || !delivery ? (
                <p className="products-empty">
                    Ładowanie szczegółów dostawy...
                </p>
            ) : (
                <>
                    <div className="warehouse-form-card">
                        <div className="warehouse-meta-grid">
                            <div>
                                nr dostawy:{' '}
                                <strong>{delivery.deliveryNumber}</strong>
                            </div>
                            <div>
                                status:{' '}
                                <strong>
                                    {deliveryStatusLabel[delivery.status] ??
                                        delivery.status}
                                </strong>
                            </div>
                            <div>
                                dostawca:{' '}
                                <strong>
                                    {delivery.supplier?.name ?? '-'}
                                </strong>
                            </div>
                            <div>
                                data:{' '}
                                <strong>
                                    {delivery.deliveryDate
                                        ? new Date(
                                              delivery.deliveryDate,
                                          ).toLocaleDateString('pl-PL')
                                        : '-'}
                                </strong>
                            </div>
                            <div>
                                numer faktury:{' '}
                                <strong>{delivery.invoiceNumber ?? '-'}</strong>
                            </div>
                            <div>
                                wartość:{' '}
                                <strong>
                                    {Number(delivery.totalCost ?? 0).toFixed(2)}{' '}
                                    zł
                                </strong>
                            </div>
                        </div>
                    </div>

                    <h3 className="warehouse-subtitle">Pozycje dostawy</h3>
                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>produkt</th>
                                    <th>ilość</th>
                                    <th>cena/op. (netto)</th>
                                    <th>wartość (netto)</th>
                                    <th>partia</th>
                                    <th>ważność</th>
                                </tr>
                            </thead>
                            <tbody>
                                {delivery.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            {item.product?.name ??
                                                `#${item.productId}`}
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>
                                            {Number(item.unitCost ?? 0).toFixed(
                                                2,
                                            )}{' '}
                                            zł
                                        </td>
                                        <td>
                                            {Number(
                                                item.totalCost ?? 0,
                                            ).toFixed(2)}{' '}
                                            zł
                                        </td>
                                        <td>{item.batchNumber ?? '-'}</td>
                                        <td>
                                            {item.expiryDate
                                                ? new Date(
                                                      item.expiryDate,
                                                  ).toLocaleDateString('pl-PL')
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {delivery.notes ? (
                        <>
                            <h3 className="warehouse-subtitle">Uwagi</h3>
                            <div className="warehouse-form-card">
                                <p className="products-empty">
                                    {delivery.notes}
                                </p>
                            </div>
                        </>
                    ) : null}
                </>
            )}
        </WarehouseLayout>
    );
}
