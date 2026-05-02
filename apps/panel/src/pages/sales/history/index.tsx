'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';
import type { WarehouseSale } from '@/types';

const formatCurrency = (value: number) =>
    `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)} zł`;

function saleKindLabel(sale: WarehouseSale) {
    switch (sale.kind) {
        case 'void':
            return 'void';
        case 'refund':
            return 'zwrot';
        case 'correction':
            return 'korekta';
        default:
            return 'sprzedaż';
    }
}

const PAGE_SIZE = 20;

export default function WarehouseSalesHistoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [kindFilter, setKindFilter] = useState('');
    const [page, setPage] = useState(1);
    const appointmentIdFromQuery = Number(
        Array.isArray(router.query.appointmentId)
            ? router.query.appointmentId[0]
            : router.query.appointmentId,
    );
    const appointmentIdsFromQuery = Array.from(
        new Set(
            (
                Array.isArray(router.query.appointmentIds)
                    ? router.query.appointmentIds[0]
                    : router.query.appointmentIds || ''
            )
                .split(',')
                .map((part) => Number(part.trim()))
                .filter((id) => Number.isFinite(id) && id > 0),
        ),
    );
    const appointmentIdsCsv =
        appointmentIdsFromQuery.length > 0
            ? appointmentIdsFromQuery.join(',')
            : undefined;
    const customerIdFromQuery = Number(
        Array.isArray(router.query.customerId)
            ? router.query.customerId[0]
            : router.query.customerId,
    );

    useEffect(() => {
        const t = setTimeout(() => setSearchDebounced(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading } = useWarehouseSales({
        page,
        pageSize: PAGE_SIZE,
        search: searchDebounced || undefined,
        kind: kindFilter || undefined,
        appointmentIds: appointmentIdsCsv,
        appointmentId:
            Number.isFinite(appointmentIdFromQuery) &&
            appointmentIdFromQuery > 0
                ? appointmentIdFromQuery
                : undefined,
        customerId:
            Number.isFinite(customerIdFromQuery) && customerIdFromQuery > 0
                ? customerIdFromQuery
                : undefined,
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const from = total ? (safePage - 1) * PAGE_SIZE + 1 : 0;
    const to = total ? Math.min(safePage * PAGE_SIZE, total) : 0;
    const hasAppointmentFilters =
        (Number.isFinite(appointmentIdFromQuery) && appointmentIdFromQuery > 0) ||
        appointmentIdsFromQuery.length > 0;
    const hasCustomerFilter =
        Number.isFinite(customerIdFromQuery) && customerIdFromQuery > 0;

    const clearAppointmentFilters = () => {
        const { appointmentId, appointmentIds, customerId, ...restQuery } =
            router.query;
        void router.push(
            {
                pathname: '/sales/history',
                query: restQuery,
            },
            undefined,
            { shallow: true },
        );
        setPage(1);
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia sprzedaży | SalonBW"
            heading="Magazyn / Historia sprzedaży"
            activeTab="sales"
        >
            {isLoading ? (
                <p className="salonbw-muted p-20">
                    Ładowanie historii sprzedaży...
                </p>
            ) : (
                <>
                    <div className="row mb-l">
                        <div className="col-sm-4 col-lg-5 input-with-select-sm mb-s mb-md-0">
                            <input
                                type="text"
                                placeholder="wyszukaj w historii sprzedaży..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                            <select
                                aria-label="rodzaj sprzedaży"
                                value={kindFilter}
                                onChange={(e) => {
                                    setKindFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">wszystkie</option>
                                <option value="sale">sprzedaż</option>
                                <option value="void">void</option>
                                <option value="refund">zwrot</option>
                                <option value="correction">korekta</option>
                            </select>
                        </div>
                        <div className="col-sm-8 col-lg-7">
                            <div className="d-flex flex-wrap jc-end">
                                {Number.isFinite(appointmentIdFromQuery) &&
                                appointmentIdFromQuery > 0 ? (
                                    <span className="badge text-bg-info me-2 align-self-center">
                                        Filtr: wizyta #{appointmentIdFromQuery}
                                    </span>
                                ) : null}
                                {appointmentIdsFromQuery.length > 0 ? (
                                    <span className="badge text-bg-info me-2 align-self-center">
                                        Filtr: wizyty ({appointmentIdsFromQuery.length})
                                    </span>
                                ) : null}
                                {hasCustomerFilter ? (
                                    <span className="badge text-bg-info me-2 align-self-center">
                                        Filtr: klient #{customerIdFromQuery}
                                    </span>
                                ) : null}
                                {hasAppointmentFilters || hasCustomerFilter ? (
                                    <button
                                        type="button"
                                        className="button button-default ml-xs"
                                        onClick={clearAppointmentFilters}
                                    >
                                        Pokaż wszystko
                                    </button>
                                ) : null}
                                <Link
                                    href="/sales/new"
                                    className="button button-blue ml-xs"
                                >
                                    dodaj sprzedaż
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="column_row data_table">
                        <table className="table-bordered">
                            <thead>
                                <tr>
                                    <th>Nazwa</th>
                                    <th>Rodzaj</th>
                                    <th>Suma brutto</th>
                                    <th>Sprzedano</th>
                                    <th>Pracownik</th>
                                    <th>Klient</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((sale, i) => {
                                    const firstItem =
                                        sale.items?.[0]?.productName ??
                                        sale.saleNumber;
                                    const saleType = saleKindLabel(sale);
                                    return (
                                        <tr
                                            key={sale.id}
                                            className={
                                                i % 2 === 0 ? 'odd' : 'even'
                                            }
                                        >
                                            <td className="wrap blue_text pointer link_body">
                                                <Link
                                                    href={`/sales/history/${sale.id}`}
                                                >
                                                    {firstItem}
                                                </Link>
                                            </td>
                                            <td>{saleType}</td>
                                            <td>
                                                {formatCurrency(
                                                    Number(
                                                        sale.totalGross ?? 0,
                                                    ),
                                                )}
                                            </td>
                                            <td>
                                                {new Date(
                                                    sale.soldAt,
                                                ).toLocaleDateString('pl-PL')}
                                            </td>
                                            <td>
                                                {sale.employee?.name ?? '-'}
                                            </td>
                                            <td>{sale.clientName ?? '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination_container">
                        <div className="column_row">
                            <div className="row">
                                <div className="info col-xs-7">
                                    Pozycje od {from} do {to} z {total} | na
                                    stronie 20
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
                                    <a className="pointer">{totalPages}</a>
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
