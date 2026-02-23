'use client';

import { useState } from 'react';
import { useCustomerEventHistory } from '@/hooks/useCustomers';
import Link from 'next/link';

interface Props {
    customerId: number;
}

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'no_show';

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

    const today = new Date();
    const defaultTo = toIsoDate(today);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const defaultFrom = toIsoDate(oneYearAgo);

    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);

    const { data, isLoading, error } = useCustomerEventHistory(customerId, {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        from,
        to,
        status: statusQuery(status),
        withCounts: true,
    });

    if (isLoading) {
        return (
            <div className="customer-loading">Ładowanie historii wizyt...</div>
        );
    }

    if (error || !data) {
        return (
            <div className="customer-error">
                <p>Nie udało się załadować historii wizyt</p>
            </div>
        );
    }

    const items = Array.isArray(data.items)
        ? data.items.filter(
              (item) =>
                  item &&
                  typeof item === 'object' &&
                  typeof item.date === 'string',
          )
        : [];
    const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));
    const fromItem = data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
    const toItem = Math.min(page * PAGE_SIZE, data.total);

    const itemsByMonth = (() => {
        const map = new Map<string, typeof items>();
        for (const item of items) {
            const key = item.date.slice(0, 7);
            const existing = map.get(key);
            if (existing) existing.push(item);
            else map.set(key, [item]);
        }
        return Array.from(map.entries());
    })();

    const counts = data.counts;
    const fmtCount = (n: number | undefined) =>
        typeof n === 'number' ? ` ${n}` : '';

    return (
        <div className="customer-history-tab customer-history-tab--versum">
            <div className="customer-history-toolbar">
                <button type="button" className="btn btn-default btn-xs">
                    filtruj
                </button>
            </div>

            <div className="customer-history-toolbar customer-history-toolbar--tight">
                <div className="customer-history-filters">
                    <button
                        type="button"
                        className={`btn btn-xs ${status === 'all' ? 'btn-primary' : 'btn-default'}`}
                        onClick={() => {
                            setStatus('all');
                            setPage(1);
                        }}
                    >
                        wszystkie wizyty{fmtCount(counts?.all)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-xs ${status === 'upcoming' ? 'btn-primary' : 'btn-default'}`}
                        onClick={() => {
                            setStatus('upcoming');
                            setPage(1);
                        }}
                    >
                        oczekujące{fmtCount(counts?.upcoming)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-xs ${status === 'completed' ? 'btn-primary' : 'btn-default'}`}
                        onClick={() => {
                            setStatus('completed');
                            setPage(1);
                        }}
                    >
                        zfinalizowane{fmtCount(counts?.completed)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-xs ${status === 'cancelled' ? 'btn-primary' : 'btn-default'}`}
                        onClick={() => {
                            setStatus('cancelled');
                            setPage(1);
                        }}
                    >
                        anulowane{fmtCount(counts?.cancelled)}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-xs ${status === 'no_show' ? 'btn-primary' : 'btn-default'}`}
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
                        className="form-control input-sm"
                        value={to}
                        onChange={(e) => {
                            setTo(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {items.length === 0 ? (
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
                <div className="customers-history-pagination customers-history-pagination--versum">
                    <span>
                        Pozycje od {fromItem} do {toItem} z {data.total}
                    </span>
                    <div className="btn-group">
                        <button
                            type="button"
                            className="btn btn-default btn-xs"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            &lt;
                        </button>
                        <button
                            type="button"
                            className="btn btn-default btn-xs"
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
