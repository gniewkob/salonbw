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
                <Link href="/deliveries/new" className="btn btn-primary btn-xs">
                    dodaj dostawę
                </Link>
            }
        >
            {isLoading ? (
                <p className="products-empty">Ładowanie historii dostaw...</p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>nr dostawy</th>
                                <th>dostawca</th>
                                <th>data</th>
                                <th>status</th>
                                <th>wartość</th>
                                <th>akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map((delivery) => (
                                <tr key={delivery.id}>
                                    <td>{delivery.deliveryNumber}</td>
                                    <td>{delivery.supplier?.name ?? '-'}</td>
                                    <td>
                                        {delivery.deliveryDate
                                            ? new Date(
                                                  delivery.deliveryDate,
                                              ).toLocaleDateString('pl-PL')
                                            : '-'}
                                    </td>
                                    <td>{delivery.status}</td>
                                    <td>
                                        {Number(
                                            delivery.totalCost ?? 0,
                                        ).toFixed(2)}{' '}
                                        zł
                                    </td>
                                    <td>
                                        {delivery.status === 'draft' ||
                                        delivery.status === 'pending' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="products-link"
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
                                                    className="products-link"
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
