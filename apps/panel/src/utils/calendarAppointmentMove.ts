/**
 * Validate an optimistic FullCalendar drag/resize BEFORE calling the API.
 *
 * FullCalendar can emit a null end date for some all-day/period events.
 * Never leave such an optimistic move on screen without persisting it:
 * the caller must invoke info.revert() whenever this returns null.
 */
export function resolveCalendarAppointmentMove(
    eventId: string,
    start: Date | null,
    end: Date | null,
): { id: number; start: Date; end: Date } | null {
    const match = /^appointment-([1-9]\d*)$/.exec(eventId);
    if (!match) return null;

    const id = Number(match[1]);
    if (!Number.isSafeInteger(id)) return null;
    if (!start || !end) return null;

    const startMs = start.getTime();
    const endMs = end.getTime();
    if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        endMs <= startMs
    ) {
        return null;
    }

    return { id, start, end };
}
