import { mapAppointmentsToEvents, colorFor } from '@/utils/calendarMap';
import type { Appointment, Employee, Service } from '@/types';

describe('calendar mapping', () => {
    it('filters by employee and maps title/colors', () => {
        const appointments: Appointment[] = [
            {
                id: 1,
                startTime: '2025-01-01T10:00:00Z',
                client: { id: 1, name: 'Alice' },
                service: { id: 1, name: 'Cut', duration: 30, price: 10 },
                employee: { id: 2, name: 'Bob' },
                paymentStatus: 'completed',
            },
            {
                id: 2,
                startTime: '2025-01-01T11:00:00Z',
                client: { id: 2, name: 'Cathy' },
                service: { id: 1, name: 'Cut', duration: 30, price: 10 },
                employee: { id: 3, name: 'Dan' },
                paymentStatus: 'cancelled',
            },
        ];
        const services: Service[] = [
            { id: 1, name: 'Cut', duration: 30, price: 10 },
            { id: 2, name: 'Color', duration: 60, price: 20 },
        ];
        const employees: Employee[] = [
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Dan' },
        ];

        // Filter to employee 2
        const events = mapAppointmentsToEvents(
            appointments,
            services,
            employees,
            2,
        );
        expect(events).toHaveLength(1);
        expect(events[0].id).toBe('1');
        expect(events[0].title).toContain('Alice');
        expect(events[0].title).toContain('Cut');
        expect(events[0].title).toContain('Bob');
        expect(events[0].backgroundColor).toBe('#16a34a'); // completed

        // No filter
        const eventsAll = mapAppointmentsToEvents(
            appointments,
            services,
            employees,
            'all',
        );
        expect(eventsAll).toHaveLength(2);
        expect(eventsAll[1].backgroundColor).toBe('#9ca3af'); // cancelled
    });

    it('colorFor covers default cases', () => {
        expect(colorFor(undefined, undefined)).toBe('#60a5fa');
        expect(colorFor(5, undefined)).toContain('hsl(');
    });
});
