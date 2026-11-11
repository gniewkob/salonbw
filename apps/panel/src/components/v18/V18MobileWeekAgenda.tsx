import { useMemo, useState, type ReactNode } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import Link from 'next/link';
import { addDays, format, startOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { CalendarEvent } from '@/types';
import { getEventStatusVisual } from '@/components/calendar/EventCard';
import { toDateParam } from '@/utils/calendarQueryState';
import {
    canDragAppointment,
    moveAppointmentToWarsawDay,
} from '@/utils/v18MobileReschedule';
import styles from '@/styles/V18MobileWeekAgenda.module.css';

interface Props {
    date: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onEventMove?: (event: CalendarEvent, start: Date, end: Date) => void;
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

function DayDropZone({
    day,
    children,
}: {
    day: WeekAgendaDay;
    children: ReactNode;
}) {
    const { isOver, setNodeRef } = useDroppable({ id: 'day-' + day.key });
    return (
        <section
            ref={setNodeRef}
            className={isOver ? styles.dropTarget : styles.day}
            data-day={day.key}
            aria-label={day.label}
        >
            {children}
        </section>
    );
}

function WeekDragHandle({ event }: { event: CalendarEvent }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: 'visit-' + event.id,
    });
    return (
        <button
            ref={setNodeRef}
            type="button"
            className={styles.dragHandle}
            data-testid="v18-mobile-week-drag-handle"
            aria-label={
                'Przeciągnij wizytę: ' + (event.clientName ?? event.title)
            }
            style={{ opacity: isDragging ? 0.5 : undefined }}
            {...attributes}
            {...listeners}
        >
            <span aria-hidden="true">⠿</span> Przytrzymaj i przenieś
        </button>
    );
}

/** Readable status-first mobile agenda, reusing the existing appointment modal. */
export default function V18MobileWeekAgenda({
    date,
    events,
    onEventClick,
    onEventMove,
}: Props) {
    const days = useMemo(() => groupWeekEvents(date, events), [date, events]);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragMessage, setDragMessage] = useState('');
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 350, tolerance: 8 },
        }),
        useSensor(KeyboardSensor),
    );
    const draggedEvent = events.find(
        (event) => event.type === 'appointment' && event.id === draggedId,
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setDraggedId(null);
        if (!onEventMove || !over) return;
        const id = Number(String(active.id).replace(/^visit-/, ''));
        const dayKey = String(over.id).replace(/^day-/, '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return;
        const event = events.find(
            (item) => item.type === 'appointment' && item.id === id,
        );
        if (!event || !canDragAppointment(event)) return;
        if (warsawDayKey(new Date(event.startTime)) === dayKey) return;
        const moved = moveAppointmentToWarsawDay(event, dayKey);
        if (!moved) {
            setDragMessage(
                'Nie można bezpiecznie przenieść wizyty na tę godzinę. Wybierz termin w edycji wizyty.',
            );
            return;
        }
        setDragMessage('');
        onEventMove(event, moved.start, moved.end);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={({ active }) => {
                setDraggedId(Number(String(active.id).replace(/^visit-/, '')));
                setDragMessage('');
            }}
            onDragCancel={() => setDraggedId(null)}
            onDragEnd={handleDragEnd}
        >
            <div
                className={styles.agenda}
                data-testid="v18-mobile-week-agenda"
                aria-label="Tygodniowa agenda wizyt"
            >
                <p className={styles.intro}>
                    Wybierz wizytę, aby zobaczyć szczegóły. Przytrzymaj uchwyt i
                    przeciągnij wizytę na inny dzień, aby zaproponować
                    przełożenie. Karta klienta otwiera jego profil.
                </p>
                {dragMessage && (
                    <p role="status" className={styles.intro}>
                        {dragMessage}
                    </p>
                )}
                {days.map((day) => (
                    <DayDropZone key={day.key} day={day}>
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
                                                    ? (event.status ??
                                                      'scheduled')
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
                                                onClick={() =>
                                                    onEventClick(event)
                                                }
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
                                                <strong
                                                    className={styles.client}
                                                >
                                                    {isAppointment
                                                        ? (event.clientName ??
                                                          'Klient')
                                                        : event.title}
                                                </strong>
                                                {isAppointment && (
                                                    <span
                                                        className={
                                                            styles.service
                                                        }
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
                                            {isAppointment &&
                                                onEventMove &&
                                                canDragAppointment(event) && (
                                                    <WeekDragHandle
                                                        event={event}
                                                    />
                                                )}
                                            {isAppointment && event.clientId ? (
                                                <Link
                                                    href={
                                                        '/studio-v18/customers/' +
                                                        event.clientId
                                                    }
                                                    className={
                                                        styles.clientLink
                                                    }
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
                    </DayDropZone>
                ))}
            </div>
            <DragOverlay dropAnimation={null}>
                {draggedEvent ? (
                    <div className={styles.dragOverlay}>
                        {draggedEvent.clientName ?? draggedEvent.title}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
