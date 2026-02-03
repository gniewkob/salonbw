import { render, screen } from '@testing-library/react';
import React from 'react';
import AppointmentsPage from '@/pages/appointments';

jest.mock('@/hooks/useAppointments', () => {
    const response = {
        data: null,
        loading: false,
        error: new Error('x'),
    };
    return {
        useAppointments: () => response,
        useMyAppointments: () => response,
    };
});
jest.mock('@/hooks/useServices', () => ({
    useServices: () => ({ data: [], loading: false }),
}));
jest.mock('@/api/appointments', () => ({
    useAppointmentsApi: () => ({ create: jest.fn(), update: jest.fn() }),
}));
jest.mock('@fullcalendar/react', () => {
    const React = require('react');
    const Calendar = () => <div>calendar</div>;
    Calendar.displayName = 'MockFullCalendar';
    return Calendar;
});
jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ role: 'client' }),
}));
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/' }) }));

describe('AppointmentsPage branches', () => {
    it('shows error state', () => {
        render(<AppointmentsPage />);
        expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
});
