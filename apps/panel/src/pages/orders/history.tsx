'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useWarehouseOrders,
    useSendWarehouseOrder,
    useCancelWarehouseOrder,
    useReceiveWarehouseOrder,
} from '@/hooks/useWarehouseViews';

export default function WarehouseOrdersHistoryPage() {
    const { data: orders = [], isLoading } = useWarehouseOrders();
    const sendMutation = useSendWarehouseOrder();
    const cancelMutation = useCancelWarehouseOrder();
    const receiveMutation = useReceiveWarehouseOrder();

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
                                <th>status</th>
                                <th>pozycje</th>
                                <th>akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.orderNumber}</td>
                                    <td>{order.supplier?.name ?? '-'}</td>
                                    <td>{order.status}</td>
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
        </WarehouseLayout>
    );
}
