import { render, screen } from '@testing-library/react';
import AppointmentsPage from '@/pages/appointments';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/hooks/useAppointments', () => ({
    useAppointments: () => ({ data: [], loading: false, error: null }),
    useMyAppointments: () => ({ data: [], loading: false, error: null }),
}));
jest.mock('@/hooks/useServices', () => ({
    useServices: () => ({ data: [], loading: false }),
}));
jest.mock('@/api/appointments', () => ({
    useAppointmentsApi: () => ({ create: jest.fn(), update: jest.fn() }),
}));
// eslint-disable-next-line react/display-name
jest.mock('@fullcalendar/react', () => () => <div>calendar</div>);
jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
jest.mock('@/contexts/AuthContext');
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/' }) }));
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Receptionist appointments', () => {
    it('shows all employees message', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({ role: 'receptionist', isAuthenticated: true }),
        );
        render(<AppointmentsPage />);
        expect(
            screen.getByText(/Viewing appointments for all employees/i),
        ).toBeInTheDocument();
    });
});
