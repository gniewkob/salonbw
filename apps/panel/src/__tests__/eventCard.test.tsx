import { fireEvent, render, screen } from '@testing-library/react';
import EventCard from '@/components/calendar/EventCard';
import type { CalendarEvent } from '@/types';

const appointmentEvent: CalendarEvent = {
    id: 42,
    type: 'appointment',
    title: 'Koloryzacja',
    startTime: '2026-05-07T10:00:00.000Z',
    endTime: '2026-05-07T10:45:00.000Z',
    employeeId: 2,
    employeeName: 'Anna',
    clientId: 5,
    clientName: 'Jan Kowalski',
    status: 'scheduled',
    paymentStatus: 'paid',
};

describe('EventCard', () => {

    it('defers pointer click to FullCalendar but preserves keyboard activation', () => {
        const onClick = jest.fn();
        render(
            <EventCard
                event={appointmentEvent}
                onClick={onClick}
                clickHandledByCalendar
            />,
        );
        const card = screen.getByRole('button');
        fireEvent.click(card);
        expect(onClick).not.toHaveBeenCalled();
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(appointmentEvent);
    });

    it('renders core appointment content', () => {
        render(
            <EventCard
                event={appointmentEvent}
                employeeColor="#4A90D9"
                onClick={jest.fn()}
            />,
        );

        expect(screen.getByText('Koloryzacja')).toBeInTheDocument();
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        // 'scheduled' and 'paid' are defaults — not shown as badges to reduce noise
        expect(screen.queryByText('Zaplanowana')).not.toBeInTheDocument();
        expect(screen.queryByText('Opłacona')).not.toBeInTheDocument();
    });

    it('shows compact alert indicator when event has customer alert flag', () => {
        render(
            <EventCard
                event={{
                    ...appointmentEvent,
                    hasCustomerAlerts: true,
                    customerAlertSeverity: 'danger',
                }}
                onClick={jest.fn()}
            />,
        );

        // Alert shown inline as a coloured dot (●) in the time strip
        expect(screen.getByText('●')).toBeInTheDocument();
    });

    it('renders paid amount even when it arrives as a string (decimal/JSON)', () => {
        render(
            <EventCard
                event={{
                    ...appointmentEvent,
                    status: 'completed',
                    // Decimal columns can deserialize as strings — must not crash
                    // (regression: paidAmount.toFixed broke the whole calendar).
                    paidAmount: '3000.00' as unknown as number,
                    paymentMethod: 'cash',
                }}
                onClick={jest.fn()}
            />,
        );

        expect(screen.getByText(/Zapłacono 3000 zł/)).toBeInTheDocument();
    });

    it('shows compact signals when appointment has visit notes or online add-ons', () => {
        render(
            <EventCard
                event={{
                    ...appointmentEvent,
                    clientComment: 'proszę o ciszę',
                    onlineAddonsSummary: 'Pielęgnacja (+30 min)',
                    staffRecommendations: 'myć włosy co 3 dni',
                    onlineDurationNeedsVerification: true,
                }}
                onClick={jest.fn()}
            />,
        );

        expect(screen.getByText('komentarz')).toBeInTheDocument();
        expect(screen.getByText('dodatki')).toBeInTheDocument();
        expect(screen.getByText('zalecenia')).toBeInTheDocument();
        expect(screen.getByText('czas do sprawdzenia')).toBeInTheDocument();
    });

    it('marks a fifteen-minute time block as compact without dropping its full label', () => {
        const start = new Date('2026-11-20T13:00:00.000Z');
        const end = new Date('2026-11-20T13:15:00.000Z');
        const shortBlock: CalendarEvent = {
            id: 77,
            type: 'time_block',
            title: 'Przerwa obiadowa',
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            employeeId: 2,
            employeeName: 'Anna',
            blockType: 'break',
        };
        const onClick = jest.fn();
        render(<EventCard event={shortBlock} onClick={onClick} />);
        const card = screen.getByRole('button', { name: /Przerwa obiadowa/ });
        expect(card).toHaveClass('salonbw-event-card--block-compact');
        expect(card).toHaveAttribute('title', expect.stringContaining('Przerwa obiadowa'));
        expect(screen.getByText('Przerwa obiadowa')).toHaveClass('salonbw-time-block__title');
        fireEvent.click(card);
        expect(onClick).toHaveBeenCalledWith(shortBlock);
    });

    it('keeps the normal two-line presentation for a longer time block', () => {
        const block: CalendarEvent = {
            id: 78,
            type: 'time_block',
            title: 'Szkolenie',
            startTime: '2026-11-20T08:00:00.000Z',
            endTime: '2026-11-20T10:00:00.000Z',
            employeeId: 2,
            employeeName: 'Anna',
            blockType: 'training',
        };
        render(<EventCard event={block} onClick={jest.fn()} />);
        const card = screen.getByRole('button', { name: /Szkolenie/ });
        expect(card).toHaveClass('salonbw-event-card--block');
        expect(card).not.toHaveClass('salonbw-event-card--block-compact');
        expect(card.querySelector('.salonbw-time-block__time')).toBeInTheDocument();
    });

    it('does not show duration verification signal after appointment is completed', () => {
        render(
            <EventCard
                event={{
                    ...appointmentEvent,
                    status: 'completed',
                    onlineDurationNeedsVerification: true,
                }}
                onClick={jest.fn()}
            />,
        );

        expect(
            screen.queryByText('czas do sprawdzenia'),
        ).not.toBeInTheDocument();
    });
});
