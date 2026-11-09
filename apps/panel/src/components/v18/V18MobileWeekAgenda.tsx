import { useMemo } from 'react';
import Link from 'next/link';
import { addDays, format, startOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { CalendarEvent } from '@/types';
import { getEventStatusVisual } from '@/components/calendar/EventCard';
import { toDateParam } from '@/utils/calendarQueryState';
import styles from '@/styles/V18MobileWeekAgenda.module.css';

interface Props {
    date: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

const WARSAW_DATE = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
const WARSAW_TIME = new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

function warsawDayKey(value: Date): string {
    const parts = WARSAW_DATE.formatToParts(value);
    const get = (part: string) =>
        parts.find((entry) => entry.type === part)?.value ?? '';
    return [get('year'), get('month'), get('day')].join('-');
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'Nieobecność',
    online_pending: 'Czeka na potwierdzenie',
    rescheduled_pending: 'Zmiana do potwierdzenia',
};

export interface WeekAgendaDay {
    key: string;
    label: string;
    appointments: number;
    events: CalendarEvent[];
}

/** Seven Warsaw-local days, including empty ones and multi-day closures. */
export function groupWeekEvents(
    date: Date,
    events: CalendarEvent[],
): WeekAgendaDay[] {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    const ordered = [...events].sort(
        (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    return Array.from({ length: 7 }, (_, offset) => {
        const day = addDays(monday, offset);
        const key = toDateParam(day);
        const dayEvents = ordered.filter((event) => {
            const start = new Date(event.startTime);
            const end = new Date(event.endTime);
            if (
                !Number.isFinite(start.getTime()) ||
                !Number.isFinite(end.getTime()) ||
                end <= start
            ) {
                return false;
            }
            const firstDay = warsawDayKey(start);
            const lastDay = warsawDayKey(new Date(end.getTime() - 1));
            return firstDay <= key && key <= lastDay;
        });

        return {
            key,
            label: format(day, 'EEEE, d MMMM', { locale: pl }),
            appointments: dayEvents.filter(
                (event) => event.type === 'appointment',
            ).length,
            events: dayEvents,
        };
    });
}

function timeLabel(event: CalendarEvent): string {
    if (event.allDay) return 'Cały dzień';
    return (
        WARSAW_TIME.format(new Date(event.startTime)) +
        '–' +
        WARSAW_TIME.format(new Date(event.endTime))
    );
}

/** Readable status-first mobile agenda, reusing the existing appointment modal. */
export default function V18MobileWeekAgenda({
    date,
    events,
    onEventClick,
}: Props) {
    const days = useMemo(() => groupWeekEvents(date, events), [date, events]);

    return (
        <div
            className={styles.agenda}
            data-testid="v18-mobile-week-agenda"
            aria-label="Tygodniowa agenda wizyt"
        >
            <p className={styles.intro}>
                Wybierz wizytę, aby zobaczyć szczegóły. Karta klienta otwiera
                jego profil.
            </p>
            {days.map((day) => (
                <section
                    key={day.key}
                    className={styles.day}
                    data-day={day.key}
                    aria-label={day.label}
                >
                    <header className={styles.dayHeader}>
                        <h3>{day.label}</h3>
                        <span>
                            {day.appointments === 1
                                ? '1 wizyta'
                                : String(day.appointments) + ' wizyt'}
                        </span>
                    </header>
                    {day.events.length === 0 ? (
                        <p className={styles.empty}>Brak wizyt i blokad</p>
                    ) : (
                        <div className={styles.dayEvents}>
                            {day.events.map((event) => {
                                const isAppointment =
                                    event.type === 'appointment';
                                const visual = getEventStatusVisual(
                                    event.status,
                                );
                                const status =
                                    APPOINTMENT_STATUS_LABELS[
                                        event.status ?? 'scheduled'
                                    ] ?? 'Zaplanowana';
                                const pending =
                                    event.status === 'online_pending' ||
                                    event.status === 'rescheduled_pending';
                                return (
                                    <article
                                        key={event.type + '-' + event.id}
                                        className={styles.card}
                                        data-testid="v18-mobile-agenda-event"
                                        data-status={
                                            isAppointment
                                                ? (event.status ?? 'scheduled')
                                                : 'time_block'
                                        }
                                        style={{
                                            borderLeftColor: isAppointment
                                                ? visual.strip
                                                : '#89909a',
                                            backgroundColor: isAppointment
                                                ? visual.body
                                                : '#f4f5f7',
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className={styles.eventButton}
                                            onClick={() => onEventClick(event)}
                                            aria-label={
                                                'Otwórz ' +
                                                (isAppointment
                                                    ? 'wizytę'
                                                    : 'blokadę') +
                                                ': ' +
                                                event.title +
                                                ', ' +
                                                timeLabel(event)
                                            }
                                        >
                                            <time
                                                className={styles.time}
                                                dateTime={event.startTime}
                                            >
                                                {timeLabel(event)}
                                            </time>
                                            <strong className={styles.client}>
                                                {isAppointment
                                                    ? (event.clientName ??
                                                      'Klient')
                                                    : event.title}
                                            </strong>
                                            {isAppointment && (
                                                <span
                                                    className={styles.service}
                                                >
                                                    {event.serviceName ??
                                                        event.title}
                                                </span>
                                            )}
                                            <span
                                                className={
                                                    pending
                                                        ? styles.pendingStatus
                                                        : styles.status
                                                }
                                            >
                                                {isAppointment
                                                    ? status
                                                    : 'Blokada czasu'}
                                            </span>
                                        </button>
                                        {isAppointment && event.clientId ? (
                                            <Link
                                                href={
                                                    '/studio-v18/customers/' +
                                                    event.clientId
                                                }
                                                className={styles.clientLink}
                                                aria-label={
                                                    'Otwórz kartę klienta ' +
                                                    (event.clientName ?? '')
                                                }
                                            >
                                                Karta klienta
                                            </Link>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}
