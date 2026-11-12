import type { CalendarEvent } from '@/types';

export type V18DropDecision =
    | 'clear'
    | 'appointment-override'
    | 'forbidden'
    | 'hard-block';

/**
 * Classifies the advisory /calendar/conflicts response. The API always
 * performs authoritative conflict checks inside the write transaction.
 * Unknown or incomplete event types fail closed, never becoming an override.
 */
export function classifyV18DropConflict(
    events: CalendarEvent[] | null | undefined,
    role: string | null | undefined,
): V18DropDecision {
    if (!events || events.length === 0) return 'forbidden';
    if (events.some((event) => event.type === 'time_block')) {
        return 'hard-block';
    }
    if (events.some((event) => event.type !== 'appointment')) {
        return 'forbidden';
    }
    return role === 'admin' ? 'appointment-override' : 'forbidden';
}
