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
        >
            {isLoading ? (
                <p className="salonbw-muted p-20">Ładowanie zamówień...</p>
            ) : (
                <>
                    <div className="row mb-l">
                        <div className="col-sm-4 col-lg-5 input-with-select-sm mb-s mb-md-0">
                            <input
                                type="text"
                                placeholder="wyszukaj w historii zamówień..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                            <select
                                aria-label="status zamówienia"
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
                        <div className="col-sm-8 col-lg-7">
                            <div className="d-flex flex-wrap jc-end">
                                <Link
                                    href="/orders/new"
                                    className="button button-blue ml-xs"
                                >
                                    dodaj zamówienie
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="column_row data_table">
                        <table className="table-bordered">
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
                                {visibleOrders.map((order, i) => (
                                    <tr
                                        key={order.id}
                                        className={i % 2 === 0 ? 'odd' : 'even'}
                                    >
                                        <td>
                                            {new Date(
                                                order.createdAt,
                                            ).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td>{order.items?.length ?? 0}</td>
                                        <td className="wrap blue_text pointer link_body">
                                            <Link href={`/orders/${order.id}`}>
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
                                                        className="blue_text"
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
                                                        className="blue_text"
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
                                                        className="blue_text"
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
                                                        className="blue_text"
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
                    <div className="pagination_container">
                        <div className="column_row">
                            <div className="row">
                                <div className="info col-xs-7">
                                    Pozycje od {from} do {to} z{' '}
                                    {searchedOrders.length} | na stronie 20
                                </div>
                                <div className="form_pagination col-xs-5">
                                    <input
                                        type="text"
                                        className="pagination-page-input"
                                        aria-label="strona"
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
                                    {' z '}
                                    <span className="pointer">
                                        {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="button button-link button_next ml-s"
                                        aria-label="Następna strona"
                                        disabled={safePage >= totalPages}
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.min(prev + 1, totalPages),
                                            )
                                        }
                                    >
                                        <span
                                            className="fc-icon fc-icon-right-single-arrow"
                                            aria-hidden="true"
                                        />
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
