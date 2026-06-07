import { useState } from 'react';
import {
    useCustomerEventHistory,
    useCustomerFollowUpActions,
} from '@/hooks/useCustomers';
import { useCustomerLinkedSales } from '@/hooks/useCustomerLinkedSales';
import Link from 'next/link';
import CustomerTimeline from './CustomerTimeline';

interface Props {
    customerId: number;
}

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'no_show';
const FOLLOW_UP_ACTION_LABELS: Record<string, string> = {
    contacted: 'Kontakt wykonany',
    deferred: 'Odroczono',
    dismissed: 'Pominięto',
    escalated: 'Eskalowano',
};
const FOLLOW_UP_REASON_LABELS: Record<string, string> = {
    recent_no_show: 'Niedawne no-show',
    stale_in_progress: 'Wizyta zbyt długo w trakcie',
    high_risk_no_contact: 'Wysokie ryzyko bez kontaktu',
};
const UNKNOWN_FOLLOW_UP_ACTION_LABEL = 'Nieznana akcja';
const UNKNOWN_FOLLOW_UP_REASON_LABEL = 'Nieznany powód';

function toIsoDate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(amount);
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '-';
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('pl-PL');
}

function formatDateTime(dateStr: string | null | undefined) {
    if (!dateStr) return '-';
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleString('pl-PL');
}

function paymentMethodLabel(value: string | null | undefined) {
    if (!value) return '-';
    switch (value) {
        case 'cash':
            return 'Gotówka';
        case 'card':
            return 'Karta';
        case 'transfer':
            return 'Przelew';
        case 'online':
            return 'Online';
        case 'voucher':
            return 'Voucher';
        default:
            return value;
    }
}

function monthLabel(yyyyMm: string) {
    const [yStr, mStr] = yyyyMm.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
        return yyyyMm;
    }
    const dt = new Date(y, m - 1, 1);
    const label = dt.toLocaleDateString('pl-PL', { month: 'long' });
    const cap = label.charAt(0).toUpperCase() + label.slice(1);
    return `${cap} ${y}`;
}

function formatWeekdayDate(dateStr: string) {
    try {
        const [y, m, d] = dateStr.split('-').map((p) => Number(p));
        if (!y || !m || !d) return dateStr;
        return new Date(y, m - 1, d).toLocaleDateString('pl-PL', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function statusQuery(filter: StatusFilter): string | undefined {
    if (filter === 'all') return undefined;
    if (filter === 'upcoming') {
        return ['scheduled', 'confirmed', 'in_progress'].join(',');
    }
    if (filter === 'completed') return 'completed';
    if (filter === 'cancelled') return 'cancelled';
    return 'no_show';
}

function visitStatusMeta(status: string) {
    switch (status) {
        case 'completed':
            return { text: 'zapłacono', icon: 'ok' as const };
        case 'cancelled':
            return { text: 'anulowano', icon: 'cancelled' as const };
        case 'no_show':
            return { text: 'nieobecność', icon: 'cancelled' as const };
        default:
            return { text: 'do zapłaty', icon: 'pending' as const };
    }
}

export default function CustomerHistoryTab({ customerId }: Props) {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<StatusFilter>('all');

    const [from, setFrom] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return toIsoDate(d);
    });
    const [to, setTo] = useState(() => toIsoDate(new Date()));

    const { data, isLoading, error } = useCustomerEventHistory(customerId, {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        from,
        to,
        status: statusQuery(status),
        withCounts: true,
    });
    const { linkedSalesQuery } = useCustomerLinkedSales(customerId, {
        salesPageSize: 5,
    });
    const {
        data: customerSales,
        isLoading: customerSalesLoading,
        isError: customerSalesError,
    } = linkedSalesQuery;
    const followUpActionsQuery = useCustomerFollowUpActions(customerId, 10);
    const followUpActions = Array.isArray(followUpActionsQuery.data?.items)
        ? followUpActionsQuery.data.items
        : [];

    const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
    const fromItem = (data?.total || 0) > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
    const toItem = Math.min(page * PAGE_SIZE, data?.total || 0);

    const itemsByMonth = (() => {
        const historyItems = Array.isArray(data?.items) ? data.items : [];
        const map = new Map<string, NonNullable<typeof data>['items']>();
        for (const item of historyItems) {
            const key = item.date.slice(0, 7);
            const existing = map.get(key);
            if (existing) existing.push(item);
            else map.set(key, [item]);
        }
        return Array.from(map.entries());
    })();

    const counts = data?.counts;
    const fmtCount = (n: number | undefined) =>
        typeof n === 'number' ? ` ${n}` : '';

    return (
        <div className="customer-history-tab customer-history-tab--salonbw">
            <div className="customer-history-toolbar">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                >
                    filtruj
                </button>
            </div>

            <div className="customer-history-toolbar customer-history-toolbar--tight">
                <div className="customer-history-filters">
                    <button
                        type="button"
                        className={`btn btn-sm ${status === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => {
                            setStatus('all');
                            setPage(1);
                        }}
                    >
                        wszystkie wizyty{fmtCount(counts?.all)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${status === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => {
                            setStatus('upcoming');
                            setPage(1);
                        }}
                    >
                        oczekujące{fmtCount(counts?.upcoming)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${status === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => {
                            setStatus('completed');
                            setPage(1);
                        }}
                    >
                        zfinalizowane{fmtCount(counts?.completed)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${status === 'cancelled' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => {
                            setStatus('cancelled');
                            setPage(1);
                        }}
                    >
                        anulowane{fmtCount(counts?.cancelled)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${status === 'no_show' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => {
                            setStatus('no_show');
                            setPage(1);
                        }}
                    >
                        nieobecności{fmtCount(counts?.no_show)}
                    </button>
                </div>

                <div className="customer-history-period">
                    <span className="customer-history-period__label">
                        okres
                    </span>
                    <input
                        type="date"
                        aria-label="Od daty"
                        className="form-control input-sm"
                        value={from}
                        onChange={(e) => {
                            setFrom(e.target.value);
                            setPage(1);
                        }}
                    />
                    <span className="customer-history-period__sep">-</span>
                    <input
                        type="date"
                        aria-label="Do daty"
                        className="form-control input-sm"
                        value={to}
                        onChange={(e) => {
                            setTo(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>
            {customerId > 0 ? (
                <div className="customer-history-toolbar customer-history-toolbar--tight">
                    <div className="w-100">
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <h4 className="small mb-0">Timeline klienta</h4>
                            </div>
                            <div className="text-muted small mb-2">
                                Szybki kontekst (wizyty, sprzedaże, notatki).
                                Szczegółowe listy znajdziesz poniżej.
                            </div>
                            <CustomerTimeline
                                customerId={customerId}
                                limit={10}
                            />
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="text-muted small">
                                Ostatnie działania follow-up
                            </div>
                        </div>
                        {followUpActionsQuery.isLoading ? (
                            <div className="text-muted small">
                                Ładowanie działań follow-up...
                            </div>
                        ) : followUpActionsQuery.isError ? (
                            <div className="text-danger small">
                                Nie udało się załadować działań follow-up.
                            </div>
                        ) : followUpActions.length === 0 ? (
                            <div className="text-muted small">
                                Brak działań follow-up.
                            </div>
                        ) : (
                            <table className="salonbw-table fs-12 mb-3">
                                <thead>
                                    <tr>
                                        <th scope="col">Data</th>
                                        <th scope="col">Akcja</th>
                                        <th scope="col">Powód</th>
                                        <th scope="col">Wizyta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {followUpActions.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                {formatDateTime(
                                                    item.occurredAt,
                                                )}
                                            </td>
                                            <td>
                                                {FOLLOW_UP_ACTION_LABELS[
                                                    item.action
                                                ] ??
                                                    UNKNOWN_FOLLOW_UP_ACTION_LABEL}
                                            </td>
                                            <td>
                                                {FOLLOW_UP_REASON_LABELS[
                                                    item.candidateReason
                                                ] ??
                                                    UNKNOWN_FOLLOW_UP_REASON_LABEL}
                                            </td>
                                            <td>
                                                {item.appointmentId > 0 ? (
                                                    <Link
                                                        href={`/calendar?appointmentId=${item.appointmentId}`}
                                                    >
                                                        #{item.appointmentId}
                                                    </Link>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="text-muted small">
                                Szczegóły sprzedaży klienta (
                                {typeof customerSales?.total === 'number'
                                    ? customerSales.total
                                    : 0}
                                )
                            </div>
                            <Link
                                href={`/sales/history?customerId=${customerId}`}
                                className="link-more"
                            >
                                Zobacz sprzedaże klienta
                            </Link>
                        </div>
                        {customerSalesLoading ? (
                            <div className="text-muted small">
                                Ładowanie sprzedaży...
                            </div>
                        ) : customerSalesError ? (
                            <div className="text-danger small">
                                Nie udało się załadować sprzedaży klienta.
                            </div>
                        ) : !customerSales ||
                          customerSales.items.length === 0 ? (
                            <div className="text-muted small">
                                Brak sprzedaży dla tego klienta.
                            </div>
                        ) : (
                            <table className="salonbw-table fs-12">
                                <thead>
                                    <tr>
                                        <th scope="col">Data</th>
                                        <th scope="col">Sprzedaż</th>
                                        <th scope="col">Metoda</th>
                                        <th scope="col" className="text-end">
                                            Kwota
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerSales.items.map((sale) => (
                                        <tr key={sale.id}>
                                            <td>{formatDate(sale.soldAt)}</td>
                                            <td>
                                                <Link
                                                    href={`/sales/history/${sale.id}`}
                                                    className="link-more"
                                                >
                                                    {sale.saleNumber}
                                                </Link>
                                            </td>
                                            <td>
                                                {paymentMethodLabel(
                                                    sale.paymentMethod,
                                                )}
                                            </td>
                                            <td className="text-end">
                                                {formatCurrency(
                                                    Number(
                                                        sale.totalGross ?? 0,
                                                    ),
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : null}

            <div className="customer-history-toolbar customer-history-toolbar--tight">
                <div className="text-muted small">Szczegóły historii wizyt</div>
            </div>

            {isLoading ? (
                <div className="customer-loading">
                    Ładowanie historii wizyt...
                </div>
            ) : error || !data ? (
                <div className="customer-error">
                    <p>Nie udało się załadować historii wizyt</p>
                </div>
            ) : !Array.isArray(data.items) || data.items.length === 0 ? (
                <div className="customer-empty-state">Brak historii wizyt.</div>
            ) : (
                <div className="customer-history-list">
                    {itemsByMonth.map(([yyyyMm, items]) => (
                        <div key={yyyyMm} className="customer-history-month">
                            <div className="customer-history-month__title">
                                {monthLabel(yyyyMm)}
                            </div>
                            <div className="customer-history-month__items">
                                {items.map((visit) => {
                                    const statusMeta = visitStatusMeta(
                                        visit.status,
                                    );
                                    return (
                                        <div
                                            key={visit.id}
                                            className="customer-history-row"
                                        >
                                            <div
                                                className={`customer-history-row__status customer-history-row__status--${statusMeta.icon}`}
                                            />
                                            <div className="customer-history-row__left">
                                                <div className="customer-history-row__service">
                                                    {visit.service ? (
                                                        <Link
                                                            href={`/services/${visit.service.id}`}
                                                            className="link-more"
                                                        >
                                                            {visit.service.name}
                                                        </Link>
                                                    ) : (
                                                        <span>-</span>
                                                    )}
                                                </div>
                                                <div className="customer-history-row__meta">
                                                    {formatWeekdayDate(
                                                        visit.date,
                                                    )}
                                                    {visit.time
                                                        ? ` od ${visit.time}`
                                                        : ''}
                                                </div>
                                            </div>
                                            <div className="customer-history-row__right">
                                                <div className="customer-history-row__price">
                                                    {formatCurrency(
                                                        visit.price,
                                                    )}
                                                </div>
                                                <div className="customer-history-row__employee">
                                                    {statusMeta.text}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="customers-history-pagination customers-history-pagination--salonbw">
                    <span>
                        Pozycje od {fromItem} do {toItem} z {data?.total || 0}
                    </span>
                    <div className="btn-group">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            &lt;
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
