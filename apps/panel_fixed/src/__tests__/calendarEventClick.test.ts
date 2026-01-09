import { appointmentFromEventClick } from '@/utils/calendarEventClick';
import type { Appointment } from '@/types';

describe('appointmentFromEventClick', () => {
    it('returns appointment when present', () => {
        const ap: Appointment = {
            id: 123,
            startTime: '2025-01-01T10:00:00Z',
            client: { id: 1, name: 'Alice' },
            service: { id: 1, name: 'Cut', duration: 30, price: 10 },
        } as unknown as Appointment;
        const info: { event: { extendedProps?: unknown } } = {
            event: { extendedProps: { appointment: ap } },
        };
        expect(appointmentFromEventClick(info)).toBe(ap);
    });

    it('returns null when missing', () => {
        expect(
            appointmentFromEventClick({
                event: {} as { extendedProps?: unknown },
            }),
        ).toBeNull();
        expect(
            appointmentFromEventClick(
                {} as { event: { extendedProps?: unknown } },
            ),
        ).toBeNull();
    });
});
