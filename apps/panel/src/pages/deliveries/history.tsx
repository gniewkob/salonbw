import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCancelDelivery,
    useDeliveries,
    useReceiveDelivery,
} from '@/hooks/useWarehouse';

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
        <>
            <Head>
                <title>Historia dostaw — Salon Black &amp; White</title>
            </Head>
            <WarehouseLayout
                pageTitle="Magazyn / Historia dostaw | SalonBW"
                heading="Magazyn / Historia dostaw"
                activeTab="products"
            >
                {isLoading ? (
                    <p className="text-muted">Ładowanie historii dostaw...</p>
                ) : (
                    <>
                        <div className="row mb-3">
                            <div className="col-sm-4 col-lg-5 input-with-select-sm mb-s mb-md-0">
                                <input
                                    type="text"
                                    placeholder="wyszukaj w historii dostaw..."
                                    aria-label="Wyszukaj w historii dostaw"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                />
                                <select
                                    aria-label="status dostawy"
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
                            <div className="col-sm-8 col-lg-7">
                                <div className="d-flex flex-wrap justify-content-end">
                                    <Link
                                        href="/deliveries/new"
                                        className="btn btn-primary ml-xs"
                                    >
                                        dodaj dostawę
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th scope="col">wystawiono</th>
                                        <th scope="col">liczba pozycji</th>
                                        <th scope="col">numer faktury</th>
                                        <th scope="col">wartość</th>
                                        <th scope="col">dostawca</th>
                                        <th scope="col">rodzaj</th>
                                        <th scope="col">wprowadzone</th>
                                        <th scope="col" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedDeliveries.map((delivery, i) => {
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
                                            <tr
                                                key={delivery.id}
                                                className={
                                                    i % 2 === 0 ? 'odd' : 'even'
                                                }
                                            >
                                                <td className="wrap blue_text pointer link_body">
                                                    <Link
                                                        href={`/deliveries/${delivery.id}`}
                                                    >
                                                        {date.toLocaleDateString(
                                                            'pl-PL',
                                                        )}
                                                    </Link>
                                                </td>
                                                <td>{itemsCount}</td>
                                                <td>
                                                    {delivery.invoiceNumber ??
                                                        '-'}
                                                </td>
                                                <td>
                                                    {formatCurrency(net)} netto
                                                    ({formatCurrency(gross)}{' '}
                                                    brutto)
                                                </td>
                                                <td>
                                                    {delivery.supplier?.name ??
                                                        '-'}
                                                </td>
                                                <td>
                                                    {typeLabel[
                                                        delivery.status
                                                    ] ??
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
                                                <td className="text-end text-nowrap">
                                                    {(delivery.status ===
                                                        'draft' ||
                                                        delivery.status ===
                                                            'pending') && (
                                                        <span className="btn-group btn-group-sm">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary"
                                                                disabled={
                                                                    receiveMutation.isPending
                                                                }
                                                                onClick={() =>
                                                                    receiveMutation.mutate(
                                                                        {
                                                                            id: delivery.id,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                przyjmij
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary"
                                                                disabled={
                                                                    cancelMutation.isPending
                                                                }
                                                                onClick={() =>
                                                                    cancelMutation.mutate(
                                                                        delivery.id,
                                                                    )
                                                                }
                                                            >
                                                                anuluj
                                                            </button>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="products-export">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    const header = [
                                        'Wystawiono',
                                        'Liczba pozycji',
                                        'Numer faktury',
                                        'Wartość netto',
                                        'Wartość brutto',
                                        'Dostawca',
                                        'Rodzaj',
                                        'Wprowadzone',
                                    ];
                                    const rows = visibleDeliveries.map(
                                        (delivery) => {
                                            const date = delivery.deliveryDate
                                                ? new Date(
                                                      delivery.deliveryDate,
                                                  )
                                                : new Date(delivery.createdAt);
                                            const created = new Date(
                                                delivery.updatedAt ??
                                                    delivery.createdAt,
                                            );
                                            const gross = Number(
                                                delivery.totalCost ?? 0,
                                            );
                                            const net = gross / 1.23;
                                            return [
                                                date.toLocaleDateString(
                                                    'pl-PL',
                                                ),
                                                String(
                                                    delivery.items?.length ?? 0,
                                                ),
                                                delivery.invoiceNumber ?? '',
                                                formatCurrency(net),
                                                formatCurrency(gross),
                                                delivery.supplier?.name ?? '',
                                                typeLabel[delivery.status] ??
                                                    statusLabel[
                                                        delivery.status
                                                    ] ??
                                                    delivery.status,
                                                created.toLocaleDateString(
                                                    'pl-PL',
                                                ),
                                            ];
                                        },
                                    );
                                    const csv = [header, ...rows]
                                        .map((line) =>
                                            line
                                                .map(
                                                    (v) =>
                                                        `"${String(v).replaceAll('"', '""')}"`,
                                                )
                                                .join(';'),
                                        )
                                        .join('\n');
                                    const blob = new Blob([`﻿${csv}`], {
                                        type: 'text/csv;charset=utf-8;',
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'historia-dostaw.csv';
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                <div
                                    className="icon sprite-exel_blue mr-xs"
                                    aria-hidden="true"
                                />
                                pobierz historię dostaw w pliku Excel
                            </button>
                        </div>
                        <nav
                            className="pagination_container"
                            aria-label="Paginacja"
                        >
                            <div className="column_row">
                                <div className="row">
                                    <div className="infocol-7">
                                        Pozycje od {from} do {to} z{' '}
                                        {visibleDeliveries.length} | na stronie
                                        20
                                    </div>
                                    <div className="form_paginationcol-5">
                                        <input
                                            type="text"
                                            className="pagination-page-input"
                                            aria-label="strona"
                                            value={safePage}
                                            onChange={(e) => {
                                                const next = Number(
                                                    e.target.value,
                                                );
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
                                        <span>{totalPages}</span>
                                        <button
                                            type="button"
                                            className="btn btn-link button_next ml-s"
                                            aria-label="Następna strona"
                                            disabled={safePage >= totalPages}
                                            onClick={() =>
                                                setPage((prev) =>
                                                    Math.min(
                                                        prev + 1,
                                                        totalPages,
                                                    ),
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
                        </nav>
                    </>
                )}
            </WarehouseLayout>
        </>
    );
}
