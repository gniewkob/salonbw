'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useWarehouseOrders,
    useSendWarehouseOrder,
    useCancelWarehouseOrder,
    useReceiveWarehouseOrder,
} from '@/hooks/useWarehouseViews';

export default function WarehouseOrdersHistoryPage() {
    const router = useRouter();
    const { data: orders = [], isLoading } = useWarehouseOrders();
    const sendMutation = useSendWarehouseOrder();
    const cancelMutation = useCancelWarehouseOrder();
    const receiveMutation = useReceiveWarehouseOrder();
    const statusFilter = Array.isArray(router.query.status)
        ? router.query.status[0]
        : router.query.status;

    const filteredOrders = statusFilter
        ? orders.filter((order) => order.status === statusFilter)
        : orders;

    const statusLabel: Record<string, string> = {
        draft: 'robocze',
        sent: 'wysłane',
        partially_received: 'częściowo przyjęte',
        received: 'przyjęte',
        cancelled: 'anulowane',
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia zamówień | SalonBW"
            heading="Magazyn / Historia zamówień"
            activeTab="orders"
            actions={
                <Link href="/orders/new" className="btn btn-primary btn-xs">
                    dodaj zamówienie
                </Link>
            }
        >
            {isLoading ? (
                <p className="products-empty">Ładowanie zamówień...</p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>nr zamówienia</th>
                                <th>dostawca</th>
                                <th>data utworzenia</th>
                                <th>status</th>
                                <th>pozycje</th>
                                <th>akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="products-link"
                                        >
                                            {order.orderNumber}
                                        </Link>
                                    </td>
                                    <td>{order.supplier?.name ?? '-'}</td>
                                    <td>
                                        {new Date(
                                            order.createdAt,
                                        ).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td>{statusLabel[order.status]}</td>
                                    <td>{order.items?.length ?? 0}</td>
                                    <td>
                                        {order.status === 'draft' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="products-link"
                                                    onClick={() =>
                                                        void sendMutation.mutateAsync(
                                                            order.id,
                                                        )
                                                    }
                                                >
                                                    wyślij
                                                </button>
                                                {' · '}
                                                <button
                                                    type="button"
                                                    className="products-link"
                                                    onClick={() =>
                                                        void cancelMutation.mutateAsync(
                                                            order.id,
                                                        )
                                                    }
                                                >
                                                    anuluj
                                                </button>
                                            </>
                                        ) : order.status === 'sent' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="products-link"
                                                    onClick={() =>
                                                        void receiveMutation.mutateAsync(
                                                            order.id,
                                                        )
                                                    }
                                                >
                                                    przyjmij
                                                </button>
                                                {' · '}
                                                <button
                                                    type="button"
                                                    className="products-link"
                                                    onClick={() =>
                                                        void cancelMutation.mutateAsync(
                                                            order.id,
                                                        )
                                                    }
                                                >
                                                    anuluj
                                                </button>
                                            </>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="products-pagination">
                Pozycje od 1 do {filteredOrders.length} | na stronie 20
            </div>
        </WarehouseLayout>
    );
}
