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
                <Link
                    href="/orders/new"
                    className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                >
                    dodaj zamówienie
                </Link>
            }
        >
            {isLoading ? (
                <p className="py-8 text-sm text-gray-500">
                    Ładowanie zamówień...
                </p>
            ) : (
                <div className="overflow-x-auto border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                            <tr>
                                <th className="px-3 py-2">nr zamówienia</th>
                                <th className="px-3 py-2">dostawca</th>
                                <th className="px-3 py-2">status</th>
                                <th className="px-3 py-2">pozycje</th>
                                <th className="px-3 py-2">akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-t border-gray-200 hover:bg-gray-50"
                                >
                                    <td className="px-3 py-2">
                                        {order.orderNumber}
                                    </td>
                                    <td className="px-3 py-2">
                                        {order.supplier?.name ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {order.status}
                                    </td>
                                    <td className="px-3 py-2">
                                        {order.items?.length ?? 0}
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                        {order.status === 'draft' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="text-sky-600 hover:underline"
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
                                                    className="text-red-600 hover:underline"
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
                                                    className="text-sky-600 hover:underline"
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
                                                    className="text-red-600 hover:underline"
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
