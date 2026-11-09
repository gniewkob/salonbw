import { useMemo } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { CalendarEvent } from '@/types';
import styles from '@/styles/V18Calendar.module.css';

const SALON_ZONE = 'Europe/Warsaw';

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SALON_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    timeZone: SALON_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'Nieobecność',
    online_pending: 'Wymaga potwierdzenia',
    rescheduled_pending: 'Zmiana do potwierdzenia',
};

const NEEDS_ATTENTION = new Set([
    'online_pending',
    'rescheduled_pending',
]);

export interface MobileWeekDay {
    key: string;
    date: Date;
    entries: CalendarEvent[];
}

function toLocalDateKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

function toSalonDateKey(date: Date): string {
    const fields: Record<string, string> = {};
    for (const part of dayFormatter.formatToParts(date)) {
        if (part.type !== 'literal') fields[part.type] = part.value;
    }
    return `${fields.year}-${fields.month}-${fields.day}`;
}

/** Group real appointments and blocked periods by salon-local day. */
export function buildMobileWeekDays(
    selectedDate: Date,
    events: CalendarEvent[],
): MobileWeekDay[] {
    const monday = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(monday, index);
        return { key: toLocalDateKey(date), date, entries: [] as CalendarEvent[] };
    });
    const byKey = new Map(days.map((day) => [day.key, day]));
    for (const event of events) {
        const start = new Date(event.startTime);
        if (!Number.isFinite(start.getTime())) continue;
        const day = byKey.get(toSalonDateKey(start));
        if (day) day.entries.push(event);
    }
    for (const day of days) {
        day.entries.sort(
            (left, right) =>
                new Date(left.startTime).getTime() -
                new Date(right.startTime).getTime(),
        );
    }
    return days;
}

interface MobileWeekAgendaProps {
    date: Date;
    events: CalendarEvent[];
    loading: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onDateClick: (date: Date) => void;
}

/**
 * Mobile-only alternative to seven compressed FullCalendar time-grid columns.
 * It shows the same API events and opens the existing booking/time-block modal.
 */
export default function MobileWeekAgenda({
    date,
    events,
    loading,
    onEventClick,
    onDateClick,
}: MobileWeekAgendaProps) {
    const days = useMemo(() => buildMobileWeekDays(date, events), [date, events]);
    const today = toLocalDateKey(new Date());
    const appointments = days.reduce(
        (sum, day) =>
            sum + day.entries.filter((entry) => entry.type === 'appointment').length,
        0,
    );

    return (
        <section
            className={styles.mobileWeekAgenda}
            aria-label="Tygodniowa agenda wizyt"
            data-testid="v18-mobile-week-agenda"
        >
            <div className={styles.mobileWeekSummary}>
                <strong>Tydzień w salonie</strong>
                <span>
                    {loading
                        ? 'Ładowanie…'
                        : `${appointments} ${appointments === 1 ? 'wizyta' : 'wizyt'}`}
                </span>
            </div>
            {days.map((day) => (
                <section
                    className={styles.mobileWeekDay}
                    key={day.key}
                    data-day={day.key}
                    aria-label={format(day.date, 'EEEE, d MMMM', { locale: pl })}
                >
                    <div className={styles.mobileWeekDayHeader}>
                        <h3>
                            {format(day.date, 'EEEE, d MMMM', { locale: pl })}
                            {day.key === today && (
                                <span className={styles.mobileToday}>Dzisiaj</span>
                            )}
                        </h3>
                        <button
                            type="button"
                            className={styles.mobileOpenDay}
                            onClick={() => onDateClick(day.date)}
                            aria-label={`Otwórz dzień ${format(day.date, 'd MMMM', {
                                locale: pl,
                            })}`}
                        >
                            Zobacz dzień
                        </button>
                    </div>
                    {loading ? (
                        <p className={styles.mobileWeekEmpty} role="status">
                            Ładowanie wizyt…
                        </p>
                    ) : day.entries.length === 0 ? (
                        <p className={styles.mobileWeekEmpty}>Brak wizyt i blokad</p>
                    ) : (
                        <div className={styles.mobileWeekItems}>
                            {day.entries.map((event) => {
                                const isBlock = event.type === 'time_block';
                                const pending = !isBlock && NEEDS_ATTENTION.has(event.status ?? '');
                                const start = new Date(event.startTime);
                                const end = new Date(event.endTime);
                                const time = event.allDay
                                    ? 'Cały dzień'
                                    : `${timeFormatter.format(start)}–${timeFormatter.format(end)}`;
                                const status = isBlock
                                    ? 'Blokada czasu'
                                    : STATUS_LABELS[event.status ?? ''] ?? 'Wizyta';
                                return (
                                    <button
                                        type="button"
                                        key={`${event.type}-${event.id}`}
                                        className={styles.mobileWeekVisit}
                                        data-tone={pending ? 'attention' : isBlock ? 'block' : 'default'}
                                        onClick={() => onEventClick(event)}
                                        aria-label={`${time}, ${isBlock ? event.title : event.clientName ?? 'Klient'}, ${status}`}
                                    >
                                        <span className={styles.mobileWeekTime}>{time}</span>
                                        <span className={styles.mobileWeekDetails}>
                                            <strong>
                                                {isBlock
                                                    ? event.title
                                                    : event.clientName ?? 'Klient'}
                                            </strong>
                                            {!isBlock && (
                                                <span>
                                                    {event.serviceName ?? event.title}
                                                </span>
                                            )}
                                            <small>{status}</small>
                                        </span>
                                        <span className={styles.mobileWeekChevron} aria-hidden="true">
                                            ›
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            ))}
        </section>
    );
}
