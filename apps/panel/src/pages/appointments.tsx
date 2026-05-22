import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import type { Appointment, AppointmentStatus } from '@/types';

interface AppointmentPage {
    items: Appointment[];
    total: number;
    page: number;
    pageSize: number;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    cancelled: 'Anulowana',
    completed: 'Zakończona',
    no_show: 'Nieobecność',
    online_pending: 'Oczekuje',
    rescheduled_pending: 'Przeniesiona',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
    scheduled: 'bg-primary',
    confirmed: 'bg-success',
    in_progress: 'bg-warning text-dark',
    cancelled: 'bg-secondary',
    completed: 'bg-success',
    no_show: 'bg-danger',
    online_pending: 'bg-info text-dark',
    rescheduled_pending: 'bg-warning text-dark',
};

function formatDateTime(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoDate(d: Date) {
    return d.toISOString().split('T')[0];
}

const ALL_STATUSES: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
    'online_pending',
    'rescheduled_pending',
];

export default function AppointmentsPage() {
    const { role, apiFetch } = useAuth();
    const router = useRouter();

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [from, setFrom] = useState(isoDate(thirtyDaysAgo));
    const [to, setTo] = useState(isoDate(today));
    const [status, setStatus] = useState<AppointmentStatus | ''>('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const limit = 50;

    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to + 'T23:59:59');
    if (status) queryParams.set('status', status);
    if (search) queryParams.set('search', search);
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));

    const { data, isLoading, error } = useQuery<AppointmentPage>({
        queryKey: ['appointments-list', from, to, status, search, page],
        queryFn: () => apiFetch<AppointmentPage>(`/appointments?${queryParams.toString()}`),
        enabled: !!role && (role === 'admin' || role === 'receptionist'),
    });

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleFilterChange = useCallback(() => {
        setPage(1);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [from, to, status]);

    const totalPages = data ? Math.ceil(data.total / limit) : 0;

    const openInCalendar = (appt: Appointment) => {
        if (!appt.startTime) return;
        const d = new Date(appt.startTime);
        const dateStr = isoDate(d);
        void router.push(`/calendar?date=${dateStr}&appointmentId=${appt.id}`);
    };

    if (!role) return null;

    if (role !== 'admin' && role !== 'receptionist') {
        return (
            <SalonShell role={role}>
                <div className="inner">
                    <p>Brak dostępu do listy wizyt.</p>
                </div>
            </SalonShell>
        );
    }

    return (
        <SalonShell role={role}>
            <div className="inner">
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_calendar"
                    items={[{ label: 'Wizyty', href: '/appointments' }]}
                />

                <div className="column_row mb-3">
                    <div className="d-flex flex-wrap gap-2 align-items-end">
                        <div>
                            <label className="form-label mb-1 small">Od</label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={from}
                                onChange={(e) => { setFrom(e.target.value); handleFilterChange(); }}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 small">Do</label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={to}
                                onChange={(e) => { setTo(e.target.value); handleFilterChange(); }}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 small">Status</label>
                            <select
                                className="form-select form-select-sm"
                                value={status}
                                onChange={(e) => { setStatus(e.target.value as AppointmentStatus | ''); handleFilterChange(); }}
                                style={{ minWidth: 160 }}
                            >
                                <option value="">Wszystkie statusy</option>
                                {ALL_STATUSES.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 180 }}>
                            <label className="form-label mb-1 small">Klient / telefon</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Szukaj..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button className="btn btn-outline-secondary" onClick={handleSearch}>
                                    Szukaj
                                </button>
                            </div>
                        </div>
                        <div>
                            <Link href="/calendar" className="btn btn-sm btn-dark">
                                + Nowa wizyta
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="column_row results_info mb-2">
                    <span className="results_title">
                        {isLoading ? 'Ładowanie...' : `${data?.total ?? 0} wizyt`}
                    </span>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        Błąd ładowania danych.
                    </div>
                )}

                <div className="data_table salonbw-table-wrap">
                    <table className="table table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Klient</th>
                                <th>Usługa</th>
                                <th>Pracownik</th>
                                <th>Status</th>
                                <th>Płatność</th>
                                <th className="text-end">Kwota</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm" role="status" />
                                        {' '}Ładowanie...
                                    </td>
                                </tr>
                            )}
                            {!isLoading && data?.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted">
                                        Brak wizyt dla wybranych filtrów.
                                    </td>
                                </tr>
                            )}
                            {data?.items.map((appt) => (
                                <tr
                                    key={appt.id}
                                    className="cursor-pointer"
                                    onClick={() => openInCalendar(appt)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {formatDateTime(appt.startTime)}
                                    </td>
                                    <td>
                                        {appt.client ? (
                                            <Link
                                                href={`/customers/${appt.client.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {appt.client.name || `${(appt.client as any).firstName ?? ''} ${(appt.client as any).lastName ?? ''}`.trim()}
                                            </Link>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                        {(appt.client as any)?.phone && (
                                            <div className="small text-muted">
                                                {(appt.client as any).phone}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {appt.service?.name ?? '—'}
                                        {(appt as any).serviceVariant?.name && (
                                            <span className="text-muted small ms-1">
                                                ({(appt as any).serviceVariant.name})
                                            </span>
                                        )}
                                    </td>
                                    <td>{appt.employee?.name ?? '—'}</td>
                                    <td>
                                        {appt.status && (
                                            <span className={`badge ${STATUS_BADGE[appt.status] ?? 'bg-secondary'}`}>
                                                {STATUS_LABELS[appt.status] ?? appt.status}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {appt.paymentMethod ? (
                                            <span className="small">
                                                {appt.paymentMethod === 'cash' ? 'Gotówka' :
                                                 appt.paymentMethod === 'card' ? 'Karta' :
                                                 appt.paymentMethod === 'transfer' ? 'Przelew' :
                                                 appt.paymentMethod}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="text-end">
                                        {appt.paidAmount != null
                                            ? `${Number(appt.paidAmount).toFixed(2)} zł`
                                            : appt.service?.price != null
                                            ? `${Number(appt.service.price).toFixed(2)} zł`
                                            : '—'}
                                    </td>
                                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={(e) => { e.stopPropagation(); openInCalendar(appt); }}
                                        >
                                            Otwórz
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination_container mt-3">
                        <div className="row">
                            <div className="info col-xs-7">
                                <span>
                                    Strona {page} z {totalPages}
                                    {' '}({data?.total} wyników)
                                </span>
                            </div>
                            <div className="form_pagination col-xs-5 d-flex gap-1 justify-content-end">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    &laquo; Poprzednia
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    const pageNum = totalPages <= 7
                                        ? i + 1
                                        : page <= 4
                                        ? i + 1
                                        : page >= totalPages - 3
                                        ? totalPages - 6 + i
                                        : page - 3 + i;
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`btn btn-sm ${pageNum === page ? 'btn-dark' : 'btn-outline-secondary'}`}
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Następna &raquo;
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SalonShell>
    );
}
