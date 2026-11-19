import type { CalendarEvent } from '@/types';

/**
 * Validate an optimistic FullCalendar drag/resize BEFORE calling the API.
 *
 * FullCalendar can emit a null end date for some all-day/period events.
 * Never leave such an optimistic move on screen without persisting it:
 * the caller must invoke info.revert() whenever this returns null.
 */
function resolveCalendarMove(
    kind: 'appointment' | 'time_block',
    eventId: string,
    start: Date | null,
    end: Date | null,
): { id: number; start: Date; end: Date } | null {
    const match = /^(appointment|time_block)-([1-9]\d*)$/.exec(eventId);
    if (!match || match[1] !== kind) return null;

    const id = Number(match[2]);
    if (!Number.isSafeInteger(id) || !start || !end) return null;

    const startMs = start.getTime();
    const endMs = end.getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return null;
    }
    return { id, start, end };
}

export function resolveCalendarAppointmentMove(
    eventId: string,
    start: Date | null,
    end: Date | null,
): { id: number; start: Date; end: Date } | null {
    return resolveCalendarMove('appointment', eventId, start, end);
}

/** V18 supports moving timed breaks, not vacations or other hard blocks. */
export function isMovableTimeBlock(event: CalendarEvent): boolean {
    return (
        event.type === 'time_block' &&
        event.blockType === 'break' &&
        event.allDay !== true
    );
}

export function resolveCalendarTimeBlockMove(
    eventId: string,
    start: Date | null,
    end: Date | null,
): { id: number; start: Date; end: Date } | null {
    return resolveCalendarMove('time_block', eventId, start, end);
}

/**
 * FullCalendar generates an optimistic event/mirror while dragging. The
 * originalEvent extended prop is a stale server snapshot, so its startTime
 * must not be used for the preview time label. This derives *render-only*
 * times; persistence and conflict/rollback logic remain unchanged.
 */
export function calendarEventForDisplay(
    original: CalendarEvent,
    renderedStart: Date | null,
    renderedEnd: Date | null,
): CalendarEvent {
    if ((original.type !== 'appointment' && !isMovableTimeBlock(original)) || !renderedStart || !renderedEnd) {
        return original;
    }
    const startMs = renderedStart.getTime();
    const endMs = renderedEnd.getTime();
    if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        endMs <= startMs
    ) {
        return original;
    }
    return {
        ...original,
        startTime: renderedStart.toISOString(),
        endTime: renderedEnd.toISOString(),
    };
}
