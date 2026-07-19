import { render, screen } from '@testing-library/react';
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
