import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface UpcomingAppointment {
    id: number;
    startTime: string;
    clientName: string;
    clientPhone?: string;
    serviceName: string;
    employeeName?: string | null;
    status?: string;
}

interface NextTwoHoursWidgetProps {
    appointments: UpcomingAppointment[];
    now?: Date;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function minutesUntil(target: Date, now: Date): number {
    return Math.round((target.getTime() - now.getTime()) / 60000);
}

function formatRelative(minutes: number): string {
    if (minutes <= 0) return 'teraz';
    if (minutes < 60) return `za ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    if (remaining === 0) return `za ${hours} h`;
    return `za ${hours} h ${remaining} min`;
}

function urgencyColor(minutes: number): string {
    if (minutes <= 10) return '#dc3545';
    if (minutes <= 30) return '#f59e0b';
    return '#6c757d';
}

function appointmentCountLabel(n: number): string {
    if (n === 1) return '1 wizyta';
    if (n < 5) return `${n} wizyty`;
    return `${n} wizyt`;
}

export default function NextTwoHoursWidget({
    appointments,
    now: nowProp,
}: NextTwoHoursWidgetProps) {
    const [tick, setTick] = useState(() => Date.now());
    useEffect(() => {
        if (nowProp) return;
        const id = window.setInterval(() => setTick(Date.now()), 60_000);
        return () => window.clearInterval(id);
    }, [nowProp]);
    const now = nowProp ?? new Date(tick);

    const cutoff = now.getTime() + TWO_HOURS_MS;
    const upcoming = appointments
        .map((a) => ({ ...a, startDate: new Date(a.startTime) }))
        .filter(
            (a) =>
                a.startDate.getTime() >= now.getTime() &&
                a.startDate.getTime() <= cutoff,
        )
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    if (upcoming.length === 0) {
        return (
            <section
                aria-label="Najbliższe 2 godziny"
                style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '0.875rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: '#6c757d',
                        }}
                    >
                        Najbliższe 2h
                    </div>
                    <div
                        style={{
                            fontSize: '0.95rem',
                            color: '#1a1a1a',
                            marginTop: '0.125rem',
                        }}
                    >
                        Wolne — żadnych wizyt nie zaczyna się w najbliższych 2
                        godzinach.
                    </div>
                </div>
                <Link
                    href="/calendar"
                    style={{
                        fontSize: '0.8rem',
                        color: '#4a4a4a',
                        textDecoration: 'none',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Otwórz kalendarz →
                </Link>
            </section>
        );
    }

    return (
        <section
            aria-label="Najbliższe 2 godziny"
            style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                marginBottom: '1rem',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem 0.5rem',
                    borderBottom: '1px solid #f3f4f6',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem' }}>
                    <span
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: '#6c757d',
                        }}
                    >
                        Najbliższe 2h
                    </span>
                    <span
                        style={{
                            fontSize: '0.8rem',
                            color: '#4a4a4a',
                            fontWeight: 500,
                        }}
                    >
                        {appointmentCountLabel(upcoming.length)}
                    </span>
                </div>
                <Link
                    href="/calendar"
                    style={{
                        fontSize: '0.8rem',
                        color: '#4a4a4a',
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}
                >
                    Otwórz kalendarz →
                </Link>
            </div>

            {/* Appointment rows */}
            <div>
                {upcoming.map((apt, idx) => {
                    const minutes = minutesUntil(apt.startDate, now);
                    const color = urgencyColor(minutes);
                    const isLast = idx === upcoming.length - 1;

                    return (
                        <div
                            key={apt.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto',
                                gap: '0 0.75rem',
                                alignItems: 'center',
                                padding: '0.625rem 1rem',
                                borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                            }}
                        >
                            {/* Time column */}
                            <div style={{ textAlign: 'right', minWidth: 44 }}>
                                <div
                                    style={{
                                        fontSize: '1.05rem',
                                        fontWeight: 700,
                                        color: '#0d0d0d',
                                        fontVariantNumeric: 'tabular-nums',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {format(apt.startDate, 'HH:mm', { locale: pl })}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color,
                                        lineHeight: 1.2,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatRelative(minutes)}
                                </div>
                            </div>

                            {/* Details column */}
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
                                            onClick={(e) => e.stopPropagation()}
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
                                        marginTop: '0.1rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {apt.serviceName}
                                    {apt.employeeName ? ` · ${apt.employeeName}` : ''}
                                </div>
                            </div>

                            {/* Badge column */}
                            <div>
                                {apt.status === 'online_pending' && (
                                    <span className="badge bg-warning text-dark">
                                        Oczekuje
                                    </span>
                                )}
                                {apt.status === 'in_progress' && (
                                    <span className="badge bg-primary">
                                        W trakcie
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
