'use client';

import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useDeliveries,
    useReceiveDelivery,
    useCancelDelivery,
} from '@/hooks/useWarehouse';

export default function WarehouseDeliveriesHistoryPage() {
    const { data: deliveries = [], isLoading } = useDeliveries();
    const receiveMutation = useReceiveDelivery();
    const cancelMutation = useCancelDelivery();

    const receive = async (id: number) => {
        await receiveMutation.mutateAsync({ id });
    };

    const cancel = async (id: number) => {
        await cancelMutation.mutateAsync(id);
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia dostaw | SalonBW"
            heading="Magazyn / Historia dostaw"
            activeTab="deliveries"
            actions={
                <Link
                    href="/deliveries/new"
                    className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                >
                    dodaj dostawę
                </Link>
            }
        >
            {isLoading ? (
                <p className="py-8 text-sm text-gray-500">
                    Ładowanie historii dostaw...
                </p>
            ) : (
                <div className="overflow-x-auto border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                            <tr>
                                <th className="px-3 py-2">nr dostawy</th>
                                <th className="px-3 py-2">dostawca</th>
                                <th className="px-3 py-2">data</th>
                                <th className="px-3 py-2">status</th>
                                <th className="px-3 py-2">wartość</th>
                                <th className="px-3 py-2">akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map((delivery) => (
                                <tr
                                    key={delivery.id}
                                    className="border-t border-gray-200 hover:bg-gray-50"
                                >
                                    <td className="px-3 py-2">
                                        {delivery.deliveryNumber}
                                    </td>
                                    <td className="px-3 py-2">
                                        {delivery.supplier?.name ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {delivery.deliveryDate
                                            ? new Date(
                                                  delivery.deliveryDate,
                                              ).toLocaleDateString('pl-PL')
                                            : '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {delivery.status}
                                    </td>
                                    <td className="px-3 py-2">
                                        {Number(
                                            delivery.totalCost ?? 0,
                                        ).toFixed(2)}{' '}
                                        zł
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                        {delivery.status === 'draft' ||
                                        delivery.status === 'pending' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="text-sky-600 hover:underline"
                                                    onClick={() =>
                                                        void receive(
                                                            delivery.id,
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
                                                        void cancel(delivery.id)
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
