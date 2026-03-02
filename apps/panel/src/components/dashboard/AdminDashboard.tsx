'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStats } from '@/hooks/useStatistics';
import { format, startOfMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: dashboardData, loading: dashboardLoading } = useDashboard();

    const { data: stats, isLoading: statsLoading } = useDashboardStats();

    if (dashboardLoading || statsLoading) {
        return (
            <div className="versum-dashboard">
                <div className="versum-dashboard__loading">
                    Ładowanie pulpitu...
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="versum-dashboard">
                <div className="versum-dashboard__empty">Brak danych</div>
            </div>
        );
    }

    // Calculate daily stats for mini chart (simplified)
    const today = new Date();
    const daysInMonth = today.getDate();

    return (
        <div className="versum-dashboard">
            {/* Header */}
            <div className="versum-dashboard__header">
                <h1 className="versum-dashboard__title">Pulpit</h1>
                <Link
                    href="/customers/new"
                    className="versum-btn versum-btn--primary"
                >
                    <i className="versum-icon versum-icon--plus"></i>
                    Dodaj klienta
                </Link>
            </div>

            {/* Stats Period Selector */}
            <div className="versum-dashboard__period">
                <button
                    type="button"
                    className="versum-dashboard__period-btn active"
                >
                    bieżący miesiąc
                </button>
                <span className="versum-dashboard__period-label">
                    Statystyki salonu:{' '}
                    {format(startOfMonth(today), 'd MMMM yyyy', { locale: pl })}{' '}
                    - {format(today, 'd MMMM yyyy', { locale: pl })}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="versum-dashboard__stats">
                {/* Liczba wizyt */}
                <div className="versum-stat-card">
                    <h3 className="versum-stat-card__title">liczba wizyt</h3>
                    <div className="versum-stat-card__value">
                        {stats.todayAppointments}
                        <span className="versum-stat-card__change positive">
                            ↑ 100%
                        </span>
                    </div>
                    <div className="versum-stat-card__chart">
                        {/* Simplified bar chart visualization */}
                        <div className="versum-mini-chart">
                            {Array.from({ length: daysInMonth }, (_, i) => (
                                <div
                                    key={i}
                                    className="versum-mini-chart__bar"
                                    {...{
                                        style: {
                                            height: `${Math.random() * 60 + 20}%`,
                                            opacity:
                                                i + 1 === today.getDate()
                                                    ? 1
                                                    : 0.6,
                                        },
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Nowych klientów */}
                <div className="versum-stat-card">
                    <h3 className="versum-stat-card__title">nowych klientów</h3>
                    <div className="versum-stat-card__value">
                        {stats.todayNewClients}
                        <span className="versum-stat-card__change positive">
                            ↑ 100%
                        </span>
                    </div>
                    <div className="versum-stat-card__chart">
                        <div className="versum-mini-chart">
                            {Array.from({ length: daysInMonth }, (_, i) => (
                                <div
                                    key={i}
                                    className="versum-mini-chart__bar versum-mini-chart__bar--blue"
                                    {...{
                                        style: {
                                            height: `${Math.random() * 40 + 10}%`,
                                            opacity:
                                                i + 1 === today.getDate()
                                                    ? 1
                                                    : 0.6,
                                        },
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Obroty salonu */}
                <div className="versum-stat-card">
                    <h3 className="versum-stat-card__title">obroty salonu</h3>
                    <div className="versum-stat-card__value">
                        <button
                            type="button"
                            className="versum-stat-card__toggle"
                        >
                            pokaż obrót
                        </button>
                        <span className="versum-stat-card__change positive">
                            ↑ 100%
                        </span>
                    </div>
                    <div className="versum-stat-card__chart">
                        <div className="versum-mini-chart">
                            {Array.from({ length: daysInMonth }, (_, i) => (
                                <div
                                    key={i}
                                    className="versum-mini-chart__bar versum-mini-chart__bar--green"
                                    {...{
                                        style: {
                                            height: `${Math.random() * 80 + 20}%`,
                                            opacity:
                                                i + 1 === today.getDate()
                                                    ? 1
                                                    : 0.6,
                                        },
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sections Grid */}
            <div className="versum-dashboard__grid">
                {/* Activity Log */}
                <div className="versum-dashboard__section">
                    <div className="versum-dashboard__section-header">
                        <h2>więcej aktywności</h2>
                        <Link
                            href="/settings/employees/activity_logs"
                            className="versum-link"
                        >
                            więcej
                        </Link>
                    </div>
                    <div className="versum-activity-list">
                        {dashboardData?.upcomingAppointments
                            ?.slice(0, 5)
                            .map((apt) => (
                                <div
                                    key={apt.id}
                                    className="versum-activity-item"
                                >
                                    <div className="versum-activity-item__avatar">
                                        {apt.client?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="versum-activity-item__content">
                                        <div className="versum-activity-item__title">
                                            Wizyta:{' '}
                                            {apt.client?.name || 'Unknown'}
                                        </div>
                                        <div className="versum-activity-item__meta">
                                            {format(
                                                new Date(apt.startTime),
                                                'd MMMM, HH:mm',
                                                { locale: pl },
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) || (
                            <div className="versum-activity-item versum-activity-item--empty">
                                Brak aktywności
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="versum-dashboard__section">
                    <div className="versum-dashboard__section-header">
                        <h2>najbliższe zaplanowane wizyty</h2>
                    </div>
                    <div className="versum-appointments-list">
                        {dashboardData?.upcomingAppointments
                            ?.slice(0, 5)
                            .map((apt) => (
                                <div
                                    key={apt.id}
                                    className="versum-appointment-item"
                                >
                                    <div className="versum-appointment-item__time">
                                        {format(
                                            new Date(apt.startTime),
                                            'HH:mm',
                                        )}
                                    </div>
                                    <div className="versum-appointment-item__details">
                                        <div className="versum-appointment-item__client">
                                            {apt.client?.name || 'Unknown'}
                                        </div>
                                        <div className="versum-appointment-item__service">
                                            {apt.service?.name || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            )) || (
                            <div className="versum-appointment-item versum-appointment-item--empty">
                                Brak zaplanowanych wizyt
                            </div>
                        )}
                    </div>
                    <Link
                        href="/calendar"
                        className="versum-dashboard__section-footer"
                    >
                        kalendarz wizyt
                    </Link>
                </div>

                {/* Tasks */}
                <div className="versum-dashboard__section">
                    <div className="versum-dashboard__section-header">
                        <h2>zadania</h2>
                        <div className="versum-dashboard__section-actions">
                            <button type="button" className="versum-icon-btn">
                                +
                            </button>
                            <button type="button" className="versum-icon-btn">
                                🗑
                            </button>
                        </div>
                    </div>
                    <div className="versum-tasks">
                        <div className="versum-tasks__input">
                            <input
                                type="text"
                                placeholder="nowe zadanie"
                                className="versum-input versum-input--ghost"
                            />
                        </div>
                        <div className="versum-tasks__empty">
                            Nie znaleziono żadnych zadań
                        </div>
                    </div>
                    <Link
                        href="/todo/archives/"
                        className="versum-dashboard__section-footer"
                    >
                        archiwum zadań
                    </Link>
                </div>
            </div>
        </div>
    );
}
