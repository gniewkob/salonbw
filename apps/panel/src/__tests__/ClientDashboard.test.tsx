import { render, screen, within } from '@testing-library/react';
import ClientDashboard from '@/components/dashboard/ClientDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const refetchMock = jest.fn();

jest.mock('@/hooks/useDashboard', () => ({
    useClientDashboard: jest.fn(() => ({
        loading: false,
        error: null,
        refetch: refetchMock,
        data: {
            upcomingAppointment: {
                id: 10,
                serviceId: 1,
                serviceName: 'Strzyżenie',
                startTime: '2026-07-12T10:00:00.000Z',
                employeeName: 'Aleksandra',
                status: 'confirmed',
            },
            pendingRescheduleAppointment: {
                id: 42,
                serviceId: 2,
                serviceName: 'Koloryzacja',
                startTime: '2026-07-15T14:30:00.000Z',
                reschedulePreviousStartTime: '2026-07-12T10:00:00.000Z',
                reschedulePreviousEndTime: '2026-07-12T12:00:00.000Z',
                employeeName: 'Aleksandra',
                status: 'rescheduled_pending',
            },
            completedCount: 1,
            serviceHistory: [],
            recentAppointments: [
                {
                    id: 42,
                    serviceId: 2,
                    serviceName: 'Koloryzacja',
                    startTime: '2026-07-15T14:30:00.000Z',
                    reschedulePreviousStartTime: '2026-07-12T10:00:00.000Z',
                    reschedulePreviousEndTime: '2026-07-12T12:00:00.000Z',
                    employeeName: 'Aleksandra',
                    status: 'rescheduled_pending',
                },
                {
                    id: 7,
                    serviceId: 3,
                    serviceName: 'Dermabrazja',
                    startTime: '2026-07-01T10:00:00.000Z',
                    employeeName: 'Aleksandra',
                    status: 'completed',
                },
            ],
            pendingRescheduleCount: 1,
            newSalonMessageCount: 0,
        },
    })),
}));

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ClientDashboard', () => {
    beforeEach(() => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: jest.fn() as never,
            }),
        );
    });

    it('routes the action panel to the appointment awaiting client acceptance', () => {
        render(<ClientDashboard />);

        expect(
            screen.getByRole('heading', {
                name: 'Potwierdź zmianę terminu wizyty',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Salon proponuje zmianę terminu'),
        ).toBeInTheDocument();
        expect(screen.getByText('Było')).toBeInTheDocument();
        expect(screen.getByText('Propozycja salonu')).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Przejdź do akcji' }),
        ).toHaveAttribute('href', '/visits?visitId=42');
    });

    it('keeps active appointments out of the recent history shortcut', () => {
        render(<ClientDashboard />);

        const recentSection = screen
            .getByRole('heading', { name: 'Ostatnie wizyty' })
            .closest('section');

        expect(recentSection).not.toBeNull();
        expect(
            within(recentSection!).getByText('Dermabrazja'),
        ).toBeInTheDocument();
        expect(
            within(recentSection!).queryByText('Koloryzacja'),
        ).not.toBeInTheDocument();
    });
});
