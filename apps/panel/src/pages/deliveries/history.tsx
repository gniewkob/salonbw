'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useDeliveries } from '@/hooks/useWarehouse';

const formatCurrency = (value: number) =>
    `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)} zł`;

export default function WarehouseDeliveriesHistoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
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
    const totalPages = Math.max(
        1,
        Math.ceil(visibleDeliveries.length / pageSize),
    );
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pagedDeliveries = visibleDeliveries.slice(
        startIndex,
        startIndex + pageSize,
    );
    const from = visibleDeliveries.length ? startIndex + 1 : 0;
    const to = visibleDeliveries.length
        ? Math.min(startIndex + pageSize, visibleDeliveries.length)
        : 0;

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
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                        <select
                            className="versum-select"
                            value={statusFilter ?? ''}
                            onChange={(e) => {
                                const status = e.target.value;
                                setPage(1);
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
                                {pagedDeliveries.map((delivery) => {
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
                                                {formatCurrency(net)} netto (
                                                {formatCurrency(gross)} brutto)
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
                        <div className="products-table-footer">
                            <span>
                                Pozycje od {from} do {to} z{' '}
                                {visibleDeliveries.length}
                            </span>
                            <div className="products-table-footer__controls">
                                <span>na stronie</span>
                                <select
                                    className="versum-select versum-select--inline"
                                    value={String(pageSize)}
                                    disabled
                                >
                                    <option value="20">20</option>
                                </select>
                                <div className="products-pagination-nav">
                                    <input
                                        type="text"
                                        value={safePage}
                                        onChange={(e) => {
                                            const next = Number(e.target.value);
                                            if (
                                                Number.isFinite(next) &&
                                                next >= 1 &&
                                                next <= totalPages
                                            ) {
                                                setPage(next);
                                            }
                                        }}
                                    />
                                    <span>z {totalPages}</span>
                                    <button
                                        type="button"
                                        disabled={safePage >= totalPages}
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.min(prev + 1, totalPages),
                                            )
                                        }
                                    >
                                        {'>'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </WarehouseLayout>
    );
}
