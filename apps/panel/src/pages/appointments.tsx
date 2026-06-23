import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import type { Appointment, AppointmentStatus, ServiceVariant } from '@/types';

interface AppointmentWithVariant extends Appointment {
    serviceVariant?: ServiceVariant | null;
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
    const queryClient = useQueryClient();
    const toast = useToast();

    const initialStatus = (router.query.status as AppointmentStatus) || '';
    // Pending bookings (online_pending / rescheduled_pending) are in the
    // FUTURE — a [past..today] window hid them, so opening "wizyty oczekujące"
    // showed nothing even though the topbar badge counted them. For pending
    // statuses look forward (today..+90d); otherwise keep the recent window.
    const isPendingStatus =
        initialStatus === 'online_pending' ||
        initialStatus === 'rescheduled_pending';

    const today = new Date();
    const windowStart = new Date(today);
    windowStart.setDate(today.getDate() + (isPendingStatus ? 0 : -30));
    const windowEnd = new Date(today);
    windowEnd.setDate(today.getDate() + (isPendingStatus ? 90 : 0));

    const defaultFrom = isoDate(windowStart);
    const defaultTo = isoDate(windowEnd);
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [status, setStatus] = useState<AppointmentStatus | ''>(initialStatus);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const limit = 50;

    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    if (status) queryParams.set('status', status);

    const { data, isLoading, error } = useQuery<AppointmentWithVariant[]>({
        queryKey: ['appointments-list', from, to, status],
        queryFn: () =>
            apiFetch<AppointmentWithVariant[]>(
                `/appointments?${queryParams.toString()}`,
            ),
        enabled: !!role && (role === 'admin' || role === 'receptionist'),
    });

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleFilterChange = useCallback(() => {
        setPage(1);
    }, []);

    const hasActiveFilters =
        from !== defaultFrom ||
        to !== defaultTo ||
        status !== '' ||
        search !== '';

    const resetFilters = useCallback(() => {
        setFrom(defaultFrom);
        setTo(defaultTo);
        setStatus('');
        setSearch('');
        setSearchInput('');
        setPage(1);
    }, [defaultFrom, defaultTo]);

    useEffect(() => {
        setPage(1);
    }, [from, to, status]);

    const filteredAppointments = useMemo(() => {
        if (!data) return [];
        const needle = search.trim().toLowerCase();
        if (!needle) return data;
        return data.filter((appt) => {
            const fields = [
                appt.client?.name,
                appt.client?.phone,
                appt.employee?.name,
                appt.service?.name,
            ];
            return fields.some((value) =>
                String(value ?? '')
                    .toLowerCase()
                    .includes(needle),
            );
        });
    }, [data, search]);

    const totalResults = filteredAppointments.length;
    const totalPages = Math.ceil(totalResults / limit);
    const pageItems = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredAppointments.slice(start, start + limit);
    }, [filteredAppointments, page, limit]);

    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const openInCalendar = (appt: AppointmentWithVariant) => {
        if (!appt.startTime) return;
        const d = new Date(appt.startTime);
        const dateStr = isoDate(d);
        void router.push(`/calendar?date=${dateStr}&appointmentId=${appt.id}`);
    };

    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [confirmRejectAppt, setConfirmRejectAppt] =
        useState<AppointmentWithVariant | null>(null);

    const handleConfirm = useCallback(
        async (e: React.MouseEvent, appt: AppointmentWithVariant) => {
            e.stopPropagation();
            setActionLoading(appt.id);
            try {
                await apiFetch(`/appointments/${appt.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'confirmed' }),
                });
                toast.success(
                    'Wizyta potwierdzona — klient otrzyma powiadomienie WhatsApp',
                );
                void queryClient.invalidateQueries({
                    queryKey: ['appointments-list'],
                });
            } catch {
                toast.error('Błąd potwierdzenia wizyty');
            } finally {
                setActionLoading(null);
            }
        },
        [apiFetch, toast, queryClient],
    );

    const handleReject = useCallback(
        (e: React.MouseEvent, appt: AppointmentWithVariant) => {
            e.stopPropagation();
            setConfirmRejectAppt(appt);
        },
        [],
    );

    const doReject = useCallback(
        async (appt: AppointmentWithVariant) => {
            setActionLoading(appt.id);
            try {
                await apiFetch(`/appointments/${appt.id}/cancel`, {
                    method: 'PATCH',
                });
                toast.success('Rezerwacja odrzucona');
                void queryClient.invalidateQueries({
                    queryKey: ['appointments-list'],
                });
            } catch {
                toast.error('Błąd anulowania wizyty');
            } finally {
                setActionLoading(null);
            }
        },
        [apiFetch, toast, queryClient],
    );

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:appointments"
        >
            <Head>
                <title>Wizyty — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="inner">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_calendar"
                        items={[{ label: 'Wizyty', href: '/appointments' }]}
                    />

                    <div className="column_row mb-3">
                        <div className="d-flex flex-wrap gap-2 align-items-end">
                            <div>
                                <label
                                    htmlFor="appts-from"
                                    className="form-label mb-1 small"
                                >
                                    Od
                                </label>
                                <input
                                    id="appts-from"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={from}
                                    onChange={(e) => {
                                        setFrom(e.target.value);
                                        handleFilterChange();
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="appts-to"
                                    className="form-label mb-1 small"
                                >
                                    Do
                                </label>
                                <input
                                    id="appts-to"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={to}
                                    onChange={(e) => {
                                        setTo(e.target.value);
                                        handleFilterChange();
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="appts-status"
                                    className="form-label mb-1 small"
                                >
                                    Status
                                </label>
                                <select
                                    id="appts-status"
                                    className="form-select form-select-sm"
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(
                                            e.target.value as
                                                | AppointmentStatus
                                                | '',
                                        );
                                        handleFilterChange();
                                    }}
                                >
                                    <option value="">Wszystkie statusy</option>
                                    {ALL_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {STATUS_LABELS[s]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-grow-1">
                                <label
                                    htmlFor="appointments-search"
                                    className="form-label mb-1 small"
                                >
                                    Klient / telefon
                                </label>
                                <div className="input-group input-group-sm">
                                    <input
                                        id="appointments-search"
                                        type="text"
                                        className="form-control"
                                        placeholder="Szukaj..."
                                        value={searchInput}
                                        onChange={(e) =>
                                            setSearchInput(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && handleSearch()
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handleSearch}
                                    >
                                        Szukaj
                                    </button>
                                </div>
                            </div>
                            <div className="d-flex align-items-end gap-2">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={resetFilters}
                                    >
                                        Wyczyść filtry
                                    </button>
                                )}
                                <Link
                                    href="/calendar"
                                    className="btn btn-sm btn-dark"
                                >
                                    + Nowa wizyta
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="column_row results_info mb-2">
                        <span className="results_title">
                            {isLoading
                                ? 'Ładowanie...'
                                : `${totalResults} wizyt`}
                        </span>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            Błąd ładowania danych.
                        </div>
                    )}

                    <div className="data_table salonbw-table-wrap">
                        <table className="table table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">Data</th>
                                    <th scope="col">Klient</th>
                                    <th scope="col">Usługa</th>
                                    <th scope="col">Pracownik</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Płatność</th>
                                    <th scope="col" className="text-end">
                                        Kwota
                                    </th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="text-center py-4"
                                        >
                                            <div
                                                className="spinner-border spinner-border-sm"
                                                role="status"
                                            />{' '}
                                            Ładowanie...
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && pageItems.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="text-center py-4 text-muted"
                                        >
                                            Brak wizyt dla wybranych filtrów.
                                        </td>
                                    </tr>
                                )}
                                {pageItems.map((appt) => (
                                    <tr
                                        key={appt.id}
                                        className=""
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
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {appt.client.name}
                                                </Link>
                                            ) : (
                                                <span className="text-muted">
                                                    —
                                                </span>
                                            )}
                                            {appt.client?.phone && (
                                                <div className="small text-muted">
                                                    {appt.client.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {appt.service?.name ?? '—'}
                                            {appt.serviceVariant?.name && (
                                                <span className="text-muted small ms-1">
                                                    ({appt.serviceVariant.name})
                                                </span>
                                            )}
                                        </td>
                                        <td>{appt.employee?.name ?? '—'}</td>
                                        <td>
                                            {appt.status && (
                                                <span
                                                    className={`badge ${STATUS_BADGE[appt.status] ?? 'bg-secondary'}`}
                                                >
                                                    {STATUS_LABELS[
                                                        appt.status
                                                    ] ?? appt.status}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {appt.paymentMethod ? (
                                                <span className="small">
                                                    {appt.paymentMethod ===
                                                    'cash'
                                                        ? 'Gotówka'
                                                        : appt.paymentMethod ===
                                                            'card'
                                                          ? 'Karta'
                                                          : appt.paymentMethod ===
                                                              'transfer'
                                                            ? 'Przelew'
                                                            : appt.paymentMethod}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="text-end">
                                            {appt.paidAmount != null
                                                ? `${Number(appt.paidAmount).toFixed(2)} zł`
                                                : appt.service?.price != null
                                                  ? `${Number(appt.service.price).toFixed(2)} zł`
                                                  : '—'}
                                        </td>
                                        <td
                                            className="text-end"
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            <div className="d-flex gap-1 justify-content-end">
                                                {appt.status ===
                                                    'online_pending' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            disabled={
                                                                actionLoading ===
                                                                appt.id
                                                            }
                                                            onClick={(e) =>
                                                                void handleConfirm(
                                                                    e,
                                                                    appt,
                                                                )
                                                            }
                                                            title="Potwierdź rezerwację — klient otrzyma WhatsApp"
                                                        >
                                                            {actionLoading ===
                                                            appt.id
                                                                ? '...'
                                                                : '✓ Potwierdź'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            disabled={
                                                                actionLoading ===
                                                                appt.id
                                                            }
                                                            onClick={(e) =>
                                                                void handleReject(
                                                                    e,
                                                                    appt,
                                                                )
                                                            }
                                                            title="Odrzuć rezerwację"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openInCalendar(appt);
                                                    }}
                                                >
                                                    Otwórz
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <nav
                            className="pagination_container mt-3"
                            aria-label="Paginacja"
                        >
                            <div className="row">
                                <div className="infocol-7">
                                    <span>
                                        Strona {page} z {totalPages} (
                                        {totalResults} wyników)
                                    </span>
                                </div>
                                <div className="form_paginationcol-5 d-flex gap-1 justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        disabled={page <= 1}
                                        aria-label="Poprzednia strona"
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                    >
                                        &laquo; Poprzednia
                                    </button>
                                    {Array.from(
                                        { length: Math.min(totalPages, 7) },
                                        (_, i) => {
                                            const pageNum =
                                                totalPages <= 7
                                                    ? i + 1
                                                    : page <= 4
                                                      ? i + 1
                                                      : page >= totalPages - 3
                                                        ? totalPages - 6 + i
                                                        : page - 3 + i;
                                            return (
                                                <button
                                                    type="button"
                                                    key={pageNum}
                                                    className={`btn btn-sm ${pageNum === page ? 'btn-dark' : 'btn-outline-secondary'}`}
                                                    aria-label={`Strona ${pageNum}`}
                                                    aria-current={
                                                        pageNum === page
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                    onClick={() =>
                                                        setPage(pageNum)
                                                    }
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        },
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        disabled={page >= totalPages}
                                        aria-label="Następna strona"
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                    >
                                        Następna &raquo;
                                    </button>
                                </div>
                            </div>
                        </nav>
                    )}
                </div>
                <ConfirmModal
                    open={!!confirmRejectAppt}
                    title="Odrzuć rezerwację"
                    message="Czy na pewno chcesz odrzucić tę rezerwację i anulować wizytę?"
                    confirmLabel="Odrzuć"
                    confirmVariant="danger"
                    onConfirm={() => {
                        if (!confirmRejectAppt) return;
                        const appt = confirmRejectAppt;
                        setConfirmRejectAppt(null);
                        void doReject(appt);
                    }}
                    onCancel={() => setConfirmRejectAppt(null)}
                />
            </SalonShell>
        </RouteGuard>
    );
}
