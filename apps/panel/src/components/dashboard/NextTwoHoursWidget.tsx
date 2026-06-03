import Link from 'next/link';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface UpcomingAppointment {
    id: number;
    startTime: string;
    clientName: string;
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

export default function NextTwoHoursWidget({
    appointments,
    now = new Date(),
}: NextTwoHoursWidgetProps) {
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
            </section>
        );
    }

    const next = upcoming[0];
    const minutesToNext = minutesUntil(next.startDate, now);
    const restCount = upcoming.length - 1;

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
                flexDirection: 'column',
                gap: '0.5rem',
                borderLeftWidth: 4,
                borderLeftColor: minutesToNext <= 15 ? '#dc3545' : '#b4b8be',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                }}
            >
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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                }}
            >
                <span
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#0d0d0d',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {format(next.startDate, 'HH:mm', { locale: pl })}
                </span>
                <span
                    style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: minutesToNext <= 15 ? '#dc3545' : '#4a4a4a',
                        textTransform: 'lowercase',
                    }}
                >
                    {formatRelative(minutesToNext)}
                </span>
                <span style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {next.clientName || '—'}
                </span>
                <span
                    style={{
                        fontSize: '0.875rem',
                        color: '#6c757d',
                    }}
                >
                    · {next.serviceName}
                    {next.employeeName ? ` · ${next.employeeName}` : ''}
                </span>
            </div>
            {restCount > 0 ? (
                <div
                    style={{
                        fontSize: '0.8rem',
                        color: '#6c757d',
                    }}
                >
                    + {restCount}{' '}
                    {restCount === 1
                        ? 'kolejna wizyta'
                        : restCount < 5
                          ? 'kolejne wizyty'
                          : 'kolejnych wizyt'}{' '}
                    w tym oknie
                </div>
            ) : null}
        </section>
    );
}
