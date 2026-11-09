import { fireEvent, render, screen } from '@testing-library/react';
import type { CalendarEvent } from '@/types';
import MobileWeekAgenda, {
    buildMobileWeekDays,
} from '@/components/calendar/MobileWeekAgenda';

const appointment: CalendarEvent = {
    id: 99001,
    type: 'appointment',
    title: 'Strzyżenie',
    startTime: '2026-11-09T09:00:00.000Z',
    endTime: '2026-11-09T09:45:00.000Z',
    employeeId: 7,
    employeeName: 'Pracownik testowy',
    clientId: 12,
    clientName: 'Klient syntetyczny',
    serviceId: 15,
    serviceName: 'Strzyżenie',
    status: 'online_pending',
};

const timeBlock: CalendarEvent = {
    id: 99002,
    type: 'time_block',
    title: 'Przerwa',
    startTime: '2026-11-09T10:00:00.000Z',
    endTime: '2026-11-09T10:30:00.000Z',
    employeeId: 7,
    employeeName: 'Pracownik testowy',
};

const weekDate = new Date('2026-11-09T12:00:00');

describe('V18 single-operator mobile week agenda', () => {
    it('renders seven salon-local days and monochrome/semantic appointment states', () => {
        render(
            <MobileWeekAgenda
                date={weekDate}
                events={[appointment, timeBlock]}
                loading={false}
                onEventClick={jest.fn()}
                onDateClick={jest.fn()}
            />,
        );

        expect(
            screen.getByTestId('v18-mobile-week-agenda'),
        ).toBeInTheDocument();
        expect(screen.getByText('Klient syntetyczny')).toBeInTheDocument();
        expect(screen.getByText('Wymaga potwierdzenia')).toBeInTheDocument();
        expect(screen.getByText('Blokada czasu')).toBeInTheDocument();
        expect(screen.getByText('1 wizyta')).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: /Klient syntetyczny, Wymaga potwierdzenia/,
            }),
        ).toHaveAttribute('data-tone', 'attention');
        expect(
            screen.getByRole('button', { name: /Przerwa, Blokada czasu/ }),
        ).toHaveAttribute('data-tone', 'block');
        expect(screen.getAllByText('Brak wizyt i blokad')).toHaveLength(6);
    });

    it('opens existing event and changes to selected day without a new booking path', () => {
        const onEventClick = jest.fn();
        const onDateClick = jest.fn();
        render(
            <MobileWeekAgenda
                date={weekDate}
                events={[appointment]}
                loading={false}
                onEventClick={onEventClick}
                onDateClick={onDateClick}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: /Klient syntetyczny, Wymaga potwierdzenia/,
            }),
        );
        expect(onEventClick).toHaveBeenCalledWith(appointment);
        fireEvent.click(
            screen.getByRole('button', { name: 'Otwórz dzień 9 listopada' }),
        );
        expect(onDateClick).toHaveBeenCalledWith(expect.any(Date));
    });

    it('groups late UTC events using Europe/Warsaw local date', () => {
        const lateEvent: CalendarEvent = {
            ...appointment,
            id: 99003,
            startTime: '2026-11-08T23:30:00.000Z',
            endTime: '2026-11-09T00:00:00.000Z',
        };
        const days = buildMobileWeekDays(weekDate, [lateEvent]);
        expect(days).toHaveLength(7);
        expect(days[0].key).toBe('2026-11-09');
        expect(days[0].entries.map((event) => event.id)).toEqual([99003]);
    });

    it('does not hide all appointments during loading', () => {
        render(
            <MobileWeekAgenda
                date={weekDate}
                events={[]}
                loading
                onEventClick={jest.fn()}
                onDateClick={jest.fn()}
            />,
        );
        expect(screen.getByText('Ładowanie…')).toBeInTheDocument();
        expect(screen.getAllByText('Ładowanie wizyt…')).toHaveLength(7);
    });
});
