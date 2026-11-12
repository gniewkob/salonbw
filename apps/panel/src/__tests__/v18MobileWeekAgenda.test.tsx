import { fireEvent, render, screen, within } from '@testing-library/react';
import type { CalendarEvent } from '@/types';
import V18MobileWeekAgenda, {
    groupWeekEvents,
} from '@/components/v18/V18MobileWeekAgenda';

const appointment: CalendarEvent = {
    id: 301,
    type: 'appointment',
    title: 'Strzyżenie',
    startTime: '2026-11-09T09:00:00.000Z',
    endTime: '2026-11-09T09:45:00.000Z',
    employeeId: 7,
    employeeName: 'Aleksandra',
    clientId: 120,
    clientName: 'Klient testowy',
    serviceId: 15,
    serviceName: 'Strzyżenie',
    status: 'confirmed',
};

const pending: CalendarEvent = {
    ...appointment,
    id: 302,
    clientId: 121,
    clientName: 'Klient oczekujący',
    startTime: '2026-11-10T08:00:00.000Z',
    endTime: '2026-11-10T09:00:00.000Z',
    status: 'online_pending',
};

const closure: CalendarEvent = {
    id: 303,
    type: 'time_block',
    title: 'Nieobecność',
    startTime: '2026-11-11T09:00:00.000Z',
    endTime: '2026-11-12T09:00:00.000Z',
    employeeId: 7,
    employeeName: 'Aleksandra',
    blockType: 'vacation',
};

describe('V18 mobile weekly agenda', () => {
    const anchor = new Date(2026, 10, 9, 12, 0, 0);

    it('shows all seven ISO weekdays and keeps the one-person appointment order', () => {
        const days = groupWeekEvents(anchor, [pending, appointment]);
        expect(days).toHaveLength(7);
        expect(days[0].key).toBe('2026-11-09');
        expect(days[6].key).toBe('2026-11-15');
        expect(days[0].events).toEqual([appointment]);
        expect(days[1].events).toEqual([pending]);
        expect(days[2].appointments).toBe(0);
    });

    it('includes multi-day closures without using their bright legacy palette', () => {
        const days = groupWeekEvents(anchor, [closure]);
        expect(days[2].events).toEqual([closure]);
        expect(days[3].events).toEqual([closure]);
        expect(days[4].events).toEqual([]);
    });

    it('shows a distinct text status and opens existing visit and client navigation', () => {
        const onEventClick = jest.fn();
        render(
            <V18MobileWeekAgenda
                date={anchor}
                events={[appointment, pending, closure]}
                onEventClick={onEventClick}
            />,
        );
        const agenda = screen.getByTestId('v18-mobile-week-agenda');
        const monday = within(agenda).getByRole('region', {
            name: /poniedziałek, 9 listopada/i,
        });
        expect(within(monday).getByText('Potwierdzona')).toBeInTheDocument();
        expect(within(monday).getByText('10:00–10:45')).toBeInTheDocument();
        fireEvent.click(
            within(monday).getByRole('button', { name: /Otwórz wizytę/ }),
        );
        expect(onEventClick).toHaveBeenCalledWith(appointment);
        expect(
            within(monday).getByRole('link', { name: /Otwórz kartę klienta/ }),
        ).toHaveAttribute('href', '/studio-v18/customers/120');
        expect(screen.getByText('Czeka na potwierdzenie')).toBeInTheDocument();
        expect(screen.getAllByText('Blokada czasu')).toHaveLength(2);
        expect(
            agenda.querySelector('[data-status="confirmed"]'),
        ).toBeInTheDocument();
        expect(
            agenda.querySelector('[data-status="time_block"]'),
        ).toBeInTheDocument();
    });

    it('excludes invalid zero-duration events from weekly agenda', () => {
        const bad: CalendarEvent = {
            ...appointment,
            id: 999,
            endTime: appointment.startTime,
        };
        expect(groupWeekEvents(anchor, [bad])[0].events).toHaveLength(0);
    });
});
