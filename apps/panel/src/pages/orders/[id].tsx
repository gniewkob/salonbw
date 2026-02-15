'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCancelWarehouseOrder,
    useReceiveWarehouseOrder,
    useSendWarehouseOrder,
    useWarehouseOrder,
} from '@/hooks/useWarehouseViews';

const orderStatusLabel: Record<string, string> = {
    draft: 'robocze',
    sent: 'wysłane',
    partially_received: 'częściowo przyjęte',
    received: 'przyjęte',
    cancelled: 'anulowane',
};

export default function WarehouseOrderDetailsPage() {
    const router = useRouter();
    const orderId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);

    const { data: order, isLoading } = useWarehouseOrder(orderId);
    const sendMutation = useSendWarehouseOrder();
    const cancelMutation = useCancelWarehouseOrder();
    const receiveMutation = useReceiveWarehouseOrder();

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Szczegóły zamówienia | SalonBW"
            heading={`Magazyn / Historia zamówień / ${order?.orderNumber ?? ''}`}
            activeTab="orders"
            actions={
                <div className="btn-group">
                    <Link
                        href="/orders/history"
                        className="btn btn-default btn-xs"
                    >
                        historia zamówień
                    </Link>
                    {order?.status === 'draft' ? (
                        <>
                            <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={() =>
                                    orderId
                                        ? void sendMutation.mutateAsync(orderId)
                                        : undefined
                                }
                            >
                                wyślij
                            </button>
                            <button
                                type="button"
                                className="btn btn-default btn-xs"
                                onClick={() =>
                                    orderId
                                        ? void cancelMutation.mutateAsync(
                                              orderId,
                                          )
                                        : undefined
                                }
                            >
                                anuluj
                            </button>
                        </>
                    ) : null}
                    {order?.status === 'sent' ? (
                        <>
                            <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={() =>
                                    orderId
                                        ? void receiveMutation.mutateAsync(
                                              orderId,
                                          )
                                        : undefined
                                }
                            >
                                przyjmij
                            </button>
                            <button
                                type="button"
                                className="btn btn-default btn-xs"
                                onClick={() =>
                                    orderId
                                        ? void cancelMutation.mutateAsync(
                                              orderId,
                                          )
                                        : undefined
                                }
                            >
                                anuluj
                            </button>
                        </>
                    ) : null}
                </div>
            }
        >
            {isLoading || !order ? (
                <p className="products-empty">
                    Ładowanie szczegółów zamówienia...
                </p>
            ) : (
                <>
                    <div className="warehouse-form-card">
                        <div className="warehouse-meta-grid">
                            <div>
                                nr zamówienia:{' '}
                                <strong>{order.orderNumber}</strong>
                            </div>
                            <div>
                                status:{' '}
                                <strong>
                                    {orderStatusLabel[order.status] ??
                                        order.status}
                                </strong>
                            </div>
                            <div>
                                dostawca:{' '}
                                <strong>{order.supplier?.name ?? '-'}</strong>
                            </div>
                            <div>
                                data utworzenia:{' '}
                                <strong>
                                    {new Date(
                                        order.createdAt,
                                    ).toLocaleDateString('pl-PL')}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <h3 className="warehouse-subtitle">Pozycje zamówienia</h3>
                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>produkt</th>
                                    <th>ilość</th>
                                    <th>jednostka</th>
                                    <th>przyjęto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            {item.product?.name ??
                                                item.productName ??
                                                '-'}
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unit || '-'}</td>
                                        <td>{item.receivedQuantity ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {order.notes ? (
                        <>
                            <h3 className="warehouse-subtitle">Uwagi</h3>
                            <div className="warehouse-form-card">
                                <p className="products-empty">{order.notes}</p>
                            </div>
                        </>
                    ) : null}
                </>
            )}
        </WarehouseLayout>
    );
}
