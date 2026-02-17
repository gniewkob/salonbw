'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useDeliveries } from '@/hooks/useWarehouse';

export default function WarehouseDeliveriesHistoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const { data: deliveries = [], isLoading } = useDeliveries();
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

    const typeLabel = useMemo(
        () =>
            ({
                draft: 'korekta',
                pending: 'dostawa',
                received: 'dostawa',
                cancelled: 'korekta',
            }) as Record<string, string>,
        [],
    );

    const visibleDeliveries = filteredDeliveries.filter((delivery) => {
        if (!search.trim()) return true;
        const haystack =
            `${delivery.deliveryNumber} ${delivery.supplier?.name ?? ''} ${delivery.invoiceNumber ?? ''}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
    });

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
                <>
                    <div className="products-toolbar">
                        <input
                            type="text"
                            className="versum-input"
                            placeholder="wyszukaj w historii dostaw..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="versum-select"
                            value={statusFilter ?? ''}
                            onChange={(e) => {
                                const status = e.target.value;
                                void router.push({
                                    pathname: '/deliveries/history',
                                    query: status ? { status } : {},
                                });
                            }}
                        >
                            <option value="">wszystkie</option>
                            <option value="draft">robocze</option>
                            <option value="pending">oczekujące</option>
                            <option value="received">przyjęte</option>
                            <option value="cancelled">anulowane</option>
                        </select>
                    </div>
                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>wystawiono</th>
                                    <th>liczba pozycji</th>
                                    <th>numer faktury</th>
                                    <th>wartość</th>
                                    <th>dostawca</th>
                                    <th>rodzaj</th>
                                    <th>wprowadzone</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleDeliveries.map((delivery) => {
                                    const date = delivery.deliveryDate
                                        ? new Date(delivery.deliveryDate)
                                        : new Date(delivery.createdAt);
                                    const created = new Date(
                                        delivery.updatedAt ??
                                            delivery.createdAt,
                                    );
                                    const itemsCount =
                                        delivery.items?.length ?? 0;
                                    const gross = Number(
                                        delivery.totalCost ?? 0,
                                    );
                                    const net = gross / 1.23;
                                    return (
                                        <tr key={delivery.id}>
                                            <td>
                                                <Link
                                                    href={`/deliveries/${delivery.id}`}
                                                    className="products-link"
                                                >
                                                    {date.toLocaleDateString(
                                                        'pl-PL',
                                                    )}
                                                </Link>
                                            </td>
                                            <td>{itemsCount}</td>
                                            <td>
                                                {delivery.invoiceNumber ?? '-'}
                                            </td>
                                            <td>
                                                {net.toFixed(2)} zł netto (
                                                {gross.toFixed(2)} zł brutto)
                                            </td>
                                            <td>
                                                {delivery.supplier?.name ?? '-'}
                                            </td>
                                            <td>
                                                {typeLabel[delivery.status] ??
                                                    statusLabel[
                                                        delivery.status
                                                    ] ??
                                                    delivery.status}
                                            </td>
                                            <td>
                                                {created.toLocaleDateString(
                                                    'pl-PL',
                                                )}{' '}
                                                {created.toLocaleTimeString(
                                                    'pl-PL',
                                                    {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    },
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            <div className="products-pagination">
                Pozycje od 1 do {visibleDeliveries.length} | na stronie 20
                <div className="products-pagination-nav">
                    <input type="text" value={1} readOnly />
                    <button type="button">{'>'}</button>
                </div>
            </div>
        </WarehouseLayout>
    );
}
