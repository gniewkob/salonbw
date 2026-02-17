'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useWarehouseOrders,
    useSendWarehouseOrder,
    useCancelWarehouseOrder,
    useReceiveWarehouseOrder,
} from '@/hooks/useWarehouseViews';

export default function WarehouseOrdersHistoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
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

    const searchedOrders = useMemo(
        () =>
            filteredOrders.filter((order) => {
                if (!search.trim()) return true;
                const haystack =
                    `${order.orderNumber} ${order.supplier?.name ?? ''} ${order.items?.[0]?.productName ?? ''}`.toLowerCase();
                return haystack.includes(search.toLowerCase());
            }),
        [filteredOrders, search],
    );
    const totalPages = Math.max(1, Math.ceil(searchedOrders.length / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const visibleOrders = searchedOrders.slice(
        startIndex,
        startIndex + pageSize,
    );
    const from = searchedOrders.length ? startIndex + 1 : 0;
    const to = searchedOrders.length
        ? Math.min(startIndex + pageSize, searchedOrders.length)
        : 0;

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
                <>
                    <div className="products-toolbar">
                        <input
                            type="text"
                            className="versum-input"
                            placeholder="wyszukaj w historii zamówień..."
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
                                    pathname: '/orders/history',
                                    query: status ? { status } : {},
                                });
                            }}
                        >
                            <option value="">wszystkie</option>
                            <option value="draft">robocze</option>
                            <option value="sent">wysłane</option>
                            <option value="partially_received">
                                częściowo przyjęte
                            </option>
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
                                    <th>numer zamówienia</th>
                                    <th>dostawca</th>
                                    <th>status</th>
                                    <th>wprowadzone</th>
                                    <th>akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            {new Date(
                                                order.createdAt,
                                            ).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td>{order.items?.length ?? 0}</td>
                                        <td>
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="products-link"
                                            >
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td>{order.supplier?.name ?? '-'}</td>
                                        <td>{statusLabel[order.status]}</td>
                                        <td>
                                            {new Date(
                                                order.updatedAt ??
                                                    order.createdAt,
                                            ).toLocaleDateString('pl-PL')}{' '}
                                            {new Date(
                                                order.updatedAt ??
                                                    order.createdAt,
                                            ).toLocaleTimeString('pl-PL', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
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
                </>
            )}
            <div className="products-pagination">
                Pozycje od {from} do {to} z {searchedOrders.length} | na stronie
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
                            setPage((prev) => Math.min(prev + 1, totalPages))
                        }
                    >
                        {'>'}
                    </button>
                </div>
            </div>
        </WarehouseLayout>
    );
}
