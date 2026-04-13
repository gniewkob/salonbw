'use client';

import { useMemo } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStats } from '@/hooks/useStatistics';
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
            <div className="salonbw-dashboard">
                <div className="salonbw-dashboard__loading">
                    Ładowanie pulpitu...
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="salonbw-dashboard">
                <div className="salonbw-dashboard__empty">Brak danych</div>
            </div>
        );
    }

    return (
        <div className="salonbw-dashboard">
            <div className="salonbw-dashboard__header">
                <h1 className="salonbw-dashboard__title">Pulpit</h1>
                <Link
                    href="/customers/new"
                    className="salonbw-btn salonbw-btn--primary"
                >
                    <i className="salonbw-icon salonbw-icon--plus"></i>
                    Dodaj klienta
                </Link>
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
                <div className="salonbw-dashboard__section">
                    <div className="salonbw-dashboard__section-header">
                        <h2>więcej aktywności</h2>
                        <Link
                            href="/settings/employees/activity-logs"
                            className="salonbw-link"
                        >
                            więcej
                        </Link>
                    </div>
                    <div className="salonbw-activity-list">
                        {dashboardData?.upcomingAppointments
                            ?.slice(0, 5)
                            .map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="salonbw-activity-item"
                                >
                                    <div className="salonbw-activity-item__avatar">
                                        {appointment.client?.name?.charAt(0) ||
                                            '?'}
                                    </div>
                                    <div className="salonbw-activity-item__content">
                                        <div className="salonbw-activity-item__title">
                                            Wizyta:{' '}
                                            {appointment.client?.name ||
                                                'Unknown'}
                                        </div>
                                        <div className="salonbw-activity-item__meta">
                                            {format(
                                                new Date(appointment.startTime),
                                                'd MMMM, HH:mm',
                                                { locale: pl },
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) || (
                            <div className="salonbw-activity-item salonbw-activity-item--empty">
                                Brak aktywności
                            </div>
                        )}
                    </div>
                </div>

                <div className="salonbw-dashboard__section">
                    <div className="salonbw-dashboard__section-header">
                        <h2>najbliższe zaplanowane wizyty</h2>
                    </div>
                    <div className="salonbw-appointments-list">
                        {dashboardData?.upcomingAppointments
                            ?.slice(0, 5)
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
                                    </div>
                                    <div className="salonbw-appointment-item__details">
                                        <div className="salonbw-appointment-item__client">
                                            {appointment.client?.name ||
                                                'Unknown'}
                                        </div>
                                        <div className="salonbw-appointment-item__service">
                                            {appointment.service?.name ||
                                                'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            )) || (
                            <div className="salonbw-appointment-item salonbw-appointment-item--empty">
                                Brak zaplanowanych wizyt
                            </div>
                        )}
                    </div>
                    <Link
                        href="/calendar"
                        className="salonbw-dashboard__section-footer"
                    >
                        kalendarz wizyt
                    </Link>
                </div>

                <div className="salonbw-dashboard__section">
                    <div className="salonbw-dashboard__section-header">
                        <h2>zadania</h2>
                        <div className="salonbw-dashboard__section-actions">
                            <button type="button" className="salonbw-icon-btn">
                                +
                            </button>
                            <button type="button" className="salonbw-icon-btn">
                                •••
                            </button>
                        </div>
                    </div>
                    <div className="salonbw-empty-state">
                        Brak zadań do wykonania
                    </div>
                </div>
            </div>
        </div>
    );
}
