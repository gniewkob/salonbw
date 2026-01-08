import type { Appointment } from '@/types';

export function appointmentFromEventClick(info: {
    event: { extendedProps?: unknown };
}): Appointment | null {
    const ep =
        (info?.event?.extendedProps as
            | { appointment?: Appointment }
            | undefined) ?? undefined;
    return ep?.appointment ?? null;
}
