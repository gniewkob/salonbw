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
});
