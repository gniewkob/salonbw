'use client';

import { useMemo } from 'react';
import NextTwoHoursWidget from './NextTwoHoursWidget';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStats } from '@/hooks/useStatistics';
import { useStockSummary } from '@/hooks/useStockAlerts';
import { format, startOfMonth, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';

interface MiniChartPoint {
    date: string;
    value: number;
}

function formatMoney(value: number) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
    }).format(value);
}

function formatTrend(current: number, previous: number) {
    if (previous === 0) {
        return current === 0 ? '0%' : '+100%';
    }

    const delta = ((current - previous) / previous) * 100;
    const rounded = Math.round(delta);

    if (rounded > 0) {
        return `+${rounded}%`;
    }

    return `${rounded}%`;
}

function isPositiveTrend(current: number, previous: number) {
    if (previous === 0) {
        return current >= 0;
    }

    return current >= previous;
}

function MiniChart({
    series,
    todayKey,
    barClassName = '',
}: {
    series: MiniChartPoint[];
    todayKey: string;
    barClassName?: string;
}) {
    const maxValue = Math.max(1, ...series.map((point) => point.value));

    return (
        <div className="salonbw-mini-chart">
            {series.map((point) => {
                const ratio = point.value / maxValue;
                const height = point.value > 0 ? Math.max(8, ratio * 100) : 6;

                return (
                    <div
                        key={point.date}
                        className={`salonbw-mini-chart__bar ${barClassName}`.trim()}
                        style={{
                            height: `${height}%`,
                            opacity: point.date === todayKey ? 1 : 0.55,
                        }}
                        title={`${point.date}: ${point.value}`}
                    />
                );
            })}
        </div>
    );
}

export default function AdminDashboard() {
    const { data: dashboardData, loading: dashboardLoading } = useDashboard();
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const { data: stockSummary } = useStockSummary();

    const today = useMemo(() => new Date(), []);
    const todayKey = format(today, 'yyyy-MM-dd');
    const yesterdayKey = format(subDays(today, 1), 'yyyy-MM-dd');

    const appointmentSeries = useMemo<MiniChartPoint[]>(() => {
        return (stats?.monthDailyAppointments ?? []).map((point) => ({
            date: point.date,
            value: point.count,
        }));
    }, [stats?.monthDailyAppointments]);

    const newClientsSeries = useMemo<MiniChartPoint[]>(() => {
        return (stats?.monthDailyNewClients ?? []).map((point) => ({
            date: point.date,
            value: point.count,
        }));
    }, [stats?.monthDailyNewClients]);

    const revenueSeries = useMemo<MiniChartPoint[]>(() => {
        return (stats?.monthDailyRevenue ?? []).map((point) => ({
            date: point.date,
            value: point.totalRevenue,
        }));
    }, [stats?.monthDailyRevenue]);

    const appointmentTrend = useMemo(() => {
        const yesterday =
            appointmentSeries.find((point) => point.date === yesterdayKey)
                ?.value ?? 0;
        return {
            text: formatTrend(stats?.todayAppointments ?? 0, yesterday),
            positive: isPositiveTrend(stats?.todayAppointments ?? 0, yesterday),
        };
    }, [appointmentSeries, stats?.todayAppointments, yesterdayKey]);

    const newClientsTrend = useMemo(() => {
        const yesterday =
            newClientsSeries.find((point) => point.date === yesterdayKey)
                ?.value ?? 0;
        return {
            text: formatTrend(stats?.todayNewClients ?? 0, yesterday),
            positive: isPositiveTrend(stats?.todayNewClients ?? 0, yesterday),
        };
    }, [newClientsSeries, stats?.todayNewClients, yesterdayKey]);

    const revenueTrend = useMemo(() => {
        const yesterday =
            revenueSeries.find((point) => point.date === yesterdayKey)?.value ??
            0;
        return {
            text: formatTrend(stats?.todayRevenue ?? 0, yesterday),
            positive: isPositiveTrend(stats?.todayRevenue ?? 0, yesterday),
        };
    }, [revenueSeries, stats?.todayRevenue, yesterdayKey]);

    if (dashboardLoading || statsLoading) {
        return (
            <div
                className="salonbw-dashboard"
                role="status"
                aria-live="polite"
                aria-label="Ładowanie pulpitu"
            >
                <div className="salonbw-dashboard__header">
                    <Skeleton width={180} height={32} />
                    <div className="d-flex gap-2">
                        <Skeleton width={140} height={38} radius={6} />
                        <Skeleton width={140} height={38} radius={6} />
                    </div>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '0.75rem',
                        marginTop: '1rem',
                    }}
                >
                    {[0, 1, 2, 3].map((index) => (
                        <div
                            key={index}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.625rem',
                            }}
                        >
                            <Skeleton width="60%" height={14} />
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="100%" height={48} radius={6} />
                        </div>
                    ))}
                </div>
                <span className="visually-hidden">Ładowanie pulpitu...</span>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="salonbw-dashboard">
                <EmptyState
                    icon={<ChartBarIcon style={{ width: 48, height: 48 }} />}
                    title="Brak danych do wyświetlenia"
                    description="Statystyki pojawią się tutaj gdy w salonie odbędą się pierwsze wizyty."
                />
            </div>
        );
    }

    return (
        <div className="salonbw-dashboard">
            <div className="salonbw-dashboard__header">
                <h1 className="salonbw-dashboard__title">Pulpit</h1>
                <div className="d-flex gap-2">
                    <Link
                        href="/customers/new"
                        className="btn btn-outline-secondary"
                    >
                        Dodaj klienta
                    </Link>
                    <Link href="/calendar?new=1" className="btn btn-primary">
                        Nowa wizyta
                    </Link>
                </div>
            </div>

            <div className="salonbw-dashboard__period">
                <button
                    type="button"
                    className="salonbw-dashboard__period-btn active"
                >
                    bieżący miesiąc
                </button>
                <span className="salonbw-dashboard__period-label">
                    Statystyki salonu:{' '}
                    {format(startOfMonth(today), 'd MMMM yyyy', { locale: pl })}{' '}
                    - {format(today, 'd MMMM yyyy', { locale: pl })}
                </span>
            </div>

            {/* In-progress appointments — who's in the salon right now */}
            {(dashboardData?.inProgressAppointments ?? []).length > 0 && (
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderLeft: '4px solid #0d6efd',
                        borderRadius: 8,
                        marginBottom: '1rem',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem 0.5rem',
                            borderBottom: '1px solid #f3f4f6',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: '#0d6efd',
                            }}
                        >
                            W salonie teraz
                        </span>
                        <span
                            style={{
                                fontSize: '0.8rem',
                                color: '#4a4a4a',
                                fontWeight: 500,
                            }}
                        >
                            {(dashboardData?.inProgressAppointments ?? []).length === 1
                                ? '1 wizyta w trakcie'
                                : `${(dashboardData?.inProgressAppointments ?? []).length} wizyty w trakcie`}
                        </span>
                    </div>
                    {(dashboardData?.inProgressAppointments ?? []).map((apt, idx, arr) => (
                        <div
                            key={apt.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '0 0.75rem',
                                alignItems: 'center',
                                padding: '0.625rem 1rem',
                                borderBottom: idx < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
                            }}
                        >
                            <div style={{ textAlign: 'right', minWidth: 44 }}>
                                <div
                                    style={{
                                        fontSize: '1.05rem',
                                        fontWeight: 700,
                                        color: '#0d0d0d',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {format(new Date(apt.startTime), 'HH:mm', { locale: pl })}
                                </div>
                                <span className="badge bg-primary" style={{ fontSize: '0.68rem' }}>
                                    W trakcie
                                </span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#0d0d0d',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span>{apt.clientName || '—'}</span>
                                    {apt.clientPhone && (
                                        <a
                                            href={`tel:${apt.clientPhone}`}
                                            style={{
                                                fontSize: '0.78rem',
                                                color: '#6c757d',
                                                textDecoration: 'none',
                                                fontWeight: 400,
                                            }}
                                        >
                                            {apt.clientPhone}
                                        </a>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: '#6c757d',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {apt.serviceName}
                                    {apt.employeeName ? ` · ${apt.employeeName}` : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <NextTwoHoursWidget
                appointments={dashboardData?.upcomingAppointments ?? []}
            />

            <div className="salonbw-dashboard__stats">
                <div className="salonbw-stat-card">
                    <h3 className="salonbw-stat-card__title">liczba wizyt</h3>
                    <div className="salonbw-stat-card__value">
                        {stats.todayAppointments}
                        <span
                            className={`salonbw-stat-card__change ${appointmentTrend.positive ? 'positive' : ''}`.trim()}
                        >
                            {appointmentTrend.text}
                        </span>
                    </div>
                    <div className="salonbw-stat-card__chart">
                        <MiniChart
                            series={appointmentSeries}
                            todayKey={todayKey}
                        />
                    </div>
                </div>

                <div className="salonbw-stat-card">
                    <h3 className="salonbw-stat-card__title">
                        nowych klientów
                    </h3>
                    <div className="salonbw-stat-card__value">
                        {stats.todayNewClients}
                        <span
                            className={`salonbw-stat-card__change ${newClientsTrend.positive ? 'positive' : ''}`.trim()}
                        >
                            {newClientsTrend.text}
                        </span>
                    </div>
                    <div className="salonbw-stat-card__chart">
                        <MiniChart
                            series={newClientsSeries}
                            todayKey={todayKey}
                            barClassName="salonbw-mini-chart__bar--blue"
                        />
                    </div>
                </div>

                <div className="salonbw-stat-card">
                    <h3 className="salonbw-stat-card__title">obroty salonu</h3>
                    <div className="salonbw-stat-card__value">
                        {formatMoney(stats.todayRevenue)}
                        <span
                            className={`salonbw-stat-card__change ${revenueTrend.positive ? 'positive' : ''}`.trim()}
                        >
                            {revenueTrend.text}
                        </span>
                    </div>
                    <div className="salonbw-stat-card__chart">
                        <MiniChart
                            series={revenueSeries}
                            todayKey={todayKey}
                            barClassName="salonbw-mini-chart__bar--green"
                        />
                    </div>
                </div>
            </div>

            <div className="salonbw-dashboard__grid">
                {/* Low stock alert — second most urgent (after online bookings) */}
                {(stockSummary?.lowStockCount ?? 0) > 0 && (
                    <div
                        className="salonbw-dashboard__section"
                        style={{
                            gridColumn: '1 / -1',
                            borderLeft: '4px solid #dc2626',
                        }}
                    >
                        <div className="salonbw-dashboard__section-header">
                            <h2>
                                <span className="badge bg-danger me-2">
                                    {stockSummary?.lowStockCount}
                                </span>
                                Produkty z niskim stanem magazynowym
                            </h2>
                            <Link
                                href="/stock-alerts"
                                className="btn btn-sm btn-danger"
                            >
                                Zobacz listę
                            </Link>
                        </div>
                        <p className="small text-muted mb-0">
                            Niektóre produkty są na wyczerpaniu. Sprawdź listę i
                            zamów co potrzeba.
                        </p>
                    </div>
                )}

                {/* Pending online bookings — most urgent action */}
                {(dashboardData?.onlinePendingCount ?? 0) > 0 && (
                    <div
                        className="salonbw-dashboard__section"
                        style={{
                            gridColumn: '1 / -1',
                            borderLeft: '4px solid #f59e0b',
                        }}
                    >
                        <div className="salonbw-dashboard__section-header">
                            <h2>
                                <span className="badge bg-warning text-dark me-2">
                                    {dashboardData?.onlinePendingCount}
                                </span>
                                Rezerwacje online czekające na potwierdzenie
                            </h2>
                            <Link
                                href="/appointments?status=online_pending"
                                className="btn btn-sm btn-warning"
                            >
                                Zarządzaj
                            </Link>
                        </div>
                        <p className="small text-muted mb-0">
                            Klienci zarezerwowali wizyty online. Potwierdź lub
                            odrzuć — po potwierdzeniu klient otrzyma
                            powiadomienie WhatsApp.
                        </p>
                    </div>
                )}

                <div className="salonbw-dashboard__section">
                    <div className="salonbw-dashboard__section-header">
                        <h2>najbliższe wizyty</h2>
                        <Link href="/calendar" className="btn btn-link">
                            kalendarz
                        </Link>
                    </div>
                    <div className="salonbw-appointments-list">
                        {(dashboardData?.upcomingAppointments ?? []).length ===
                            0 && (
                            <div className="salonbw-appointment-item salonbw-appointment-item--empty">
                                Brak zaplanowanych wizyt
                            </div>
                        )}
                        {(dashboardData?.upcomingAppointments ?? [])
                            .slice(0, 6)
                            .map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="salonbw-appointment-item"
                                >
                                    <div className="salonbw-appointment-item__time">
                                        {format(
                                            new Date(appointment.startTime),
                                            'HH:mm',
                                        )}
                                        <div className="small text-muted">
                                            {format(
                                                new Date(appointment.startTime),
                                                'd MMM',
                                                { locale: pl },
                                            )}
                                        </div>
                                    </div>
                                    <div className="salonbw-appointment-item__details">
                                        <div className="salonbw-appointment-item__client">
                                            {appointment.clientName || '—'}
                                            {appointment.clientPhone && (
                                                <a
                                                    href={`tel:${appointment.clientPhone}`}
                                                    className="ms-2 small text-muted"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {appointment.clientPhone}
                                                </a>
                                            )}
                                        </div>
                                        <div className="salonbw-appointment-item__service">
                                            {appointment.serviceName}
                                            {appointment.employeeName && (
                                                <span className="text-muted ms-1">
                                                    · {appointment.employeeName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {appointment.status ===
                                        'online_pending' && (
                                        <span className="badge bg-warning text-dark ms-auto">
                                            Oczekuje
                                        </span>
                                    )}
                                </div>
                            ))}
                    </div>
                    <Link
                        href="/appointments"
                        className="salonbw-dashboard__section-footer"
                    >
                        lista wszystkich wizyt
                    </Link>
                </div>

                <div className="salonbw-dashboard__section">
                    <div className="salonbw-dashboard__section-header">
                        <h2>podsumowanie miesiąca</h2>
                        <Link href="/statistics" className="btn btn-link">
                            szczegóły
                        </Link>
                    </div>
                    <div className="salonbw-appointments-list">
                        <div className="salonbw-appointment-item">
                            <div className="salonbw-appointment-item__details">
                                <div className="salonbw-appointment-item__client">
                                    Przychód (dzisiaj)
                                </div>
                                <div className="salonbw-appointment-item__service text-muted small">
                                    z zakończonych wizyt
                                </div>
                            </div>
                            <div className="fw-bold">
                                {formatMoney(
                                    dashboardData?.revenueToday ??
                                        stats?.todayRevenue ??
                                        0,
                                )}
                            </div>
                        </div>
                        <div className="salonbw-appointment-item">
                            <div className="salonbw-appointment-item__details">
                                <div className="salonbw-appointment-item__client">
                                    Przychód (ten miesiąc)
                                </div>
                                <div className="salonbw-appointment-item__service text-muted small">
                                    z zakończonych wizyt
                                </div>
                            </div>
                            <div className="fw-bold">
                                {formatMoney(
                                    dashboardData?.revenueThisMonth ??
                                        stats?.monthRevenue ??
                                        0,
                                )}
                            </div>
                        </div>
                        <div className="salonbw-appointment-item">
                            <div className="salonbw-appointment-item__details">
                                <div className="salonbw-appointment-item__client">
                                    Zakończone wizyty (ten miesiąc)
                                </div>
                            </div>
                            <div className="fw-bold">
                                {dashboardData?.completedThisMonth ??
                                    stats?.monthAppointments ??
                                    0}
                            </div>
                        </div>
                        <div className="salonbw-appointment-item">
                            <div className="salonbw-appointment-item__details">
                                <div className="salonbw-appointment-item__client">
                                    Łączna liczba klientów
                                </div>
                            </div>
                            <div className="fw-bold">
                                {dashboardData?.clientCount ?? 0}
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/statistics"
                        className="salonbw-dashboard__section-footer"
                    >
                        pełne statystyki
                    </Link>
                </div>
            </div>
        </div>
    );
}
