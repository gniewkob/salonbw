'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useDeliveries,
    useReceiveDelivery,
    useCancelDelivery,
} from '@/hooks/useWarehouse';

export default function WarehouseDeliveriesHistoryPage() {
    const router = useRouter();
    const { data: deliveries = [], isLoading } = useDeliveries();
    const receiveMutation = useReceiveDelivery();
    const cancelMutation = useCancelDelivery();
    const statusFilter = Array.isArray(router.query.status)
        ? router.query.status[0]
        : router.query.status;

    const filteredDeliveries = statusFilter
        ? deliveries.filter((delivery) => delivery.status === statusFilter)
        : deliveries;

    const statusLabel: Record<string, string> = {
        draft: 'robocza',
        pending: 'oczekująca',
        received: 'przyjęta',
        cancelled: 'anulowana',
    };

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
                            {filteredDeliveries.map((delivery) => (
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
                                    <td>{statusLabel[delivery.status]}</td>
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
            <div className="products-pagination">
                Pozycje od 1 do {filteredDeliveries.length} | na stronie 20
            </div>
        </WarehouseLayout>
    );
}
