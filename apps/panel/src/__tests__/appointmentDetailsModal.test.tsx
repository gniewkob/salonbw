import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AppointmentDetailsModal from '@/components/AppointmentDetailsModal';
import type { Appointment } from '@/types';

const appt: Appointment = {
    id: 123,
    startTime: new Date('2030-01-01T10:00:00.000Z').toISOString(),
    client: { id: 1, name: 'John Client' },
    employee: { id: 2, name: 'Eve Employee', fullName: 'Eve Employee' },
    service: { id: 3, name: 'Haircut', duration: 60, price: 100 },
};

describe('AppointmentDetailsModal', () => {
    it('renders appointment details and triggers actions', () => {
        const onCancel = jest.fn();
        const onComplete = jest.fn();
        render(
            <AppointmentDetailsModal
                open
                onClose={() => {}}
                appointment={appt}
                canCancel
                canComplete
                onCancel={onCancel}
                onComplete={onComplete}
            />,
        );

        expect(screen.getByText(/Appointment #123/)).toBeInTheDocument();
        expect(screen.getByText(/John Client/)).toBeInTheDocument();
        expect(screen.getByText(/Haircut/)).toBeInTheDocument();
        expect(screen.getByText(/Eve Employee/)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Cancel/));
        expect(onCancel).toHaveBeenCalledWith(123);

        fireEvent.click(screen.getByText(/Complete/));
        expect(onComplete).toHaveBeenCalledWith(123);
    });
});
