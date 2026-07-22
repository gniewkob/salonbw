import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import ClientDashboard from '@/components/dashboard/ClientDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useClientDashboard } from '@/hooks/useDashboard';
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
                clientComment: 'proszę o spokojną wizytę',
                onlineAddonsSummary: 'Pielęgnacja (+30 min)',
                onlineTotalDurationMinutes: 75,
                onlineDurationNeedsVerification: true,
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
                    staffRecommendations: 'myć włosy co 3 dni',
                },
            ],
            pendingRescheduleCount: 1,
            newSalonMessageCount: 0,
        },
    })),
}));

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseClientDashboard = useClientDashboard as jest.MockedFunction<
    typeof useClientDashboard
>;

describe('ClientDashboard', () => {
    beforeEach(() => {
        refetchMock.mockClear();
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
            screen.getByRole('link', { name: 'Załatw teraz' }),
        ).toHaveAttribute('href', '/visits?visitId=42');
    });

    it('accepts a future reschedule directly from the required action panel', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const previousStart = new Date(Date.now() + 3600000).toISOString();
        const pendingAppointment = {
            id: 42,
            serviceId: 2,
            serviceName: 'Koloryzacja',
            startTime: futureStart,
            reschedulePreviousStartTime: previousStart,
            reschedulePreviousEndTime: previousStart,
            employeeName: 'Aleksandra',
            status: 'rescheduled_pending',
        };
        const apiFetch = jest.fn(async () => ({}));
        mockedUseAuth.mockReturnValueOnce(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as never,
            }),
        );
        mockedUseClientDashboard.mockReturnValueOnce({
            loading: false,
            error: null,
            refetch: refetchMock,
            data: {
                upcomingAppointment: pendingAppointment,
                pendingRescheduleAppointment: pendingAppointment,
                completedCount: 0,
                serviceHistory: [],
                recentAppointments: [],
                pendingRescheduleCount: 1,
                newSalonMessageCount: 0,
            },
        } as never);

        render(<ClientDashboard />);

        const actionPanel = screen.getByRole('alert');
        expect(
            within(actionPanel).getByRole('link', { name: 'Szczegóły' }),
        ).toHaveAttribute('href', '/visits?visitId=42');
        expect(
            screen.getAllByRole('button', { name: 'Akceptuj nowy termin' }),
        ).toHaveLength(1);
        fireEvent.click(
            within(actionPanel).getByRole('button', {
                name: 'Akceptuj nowy termin',
            }),
        );

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith(
                '/appointments/42/accept-reschedule',
                { method: 'PATCH' },
            );
        });
        expect(refetchMock).toHaveBeenCalled();
    });

    it('links appointment titles to their visit details', () => {
        render(<ClientDashboard />);

        expect(
            screen.getByRole('link', { name: 'Strzyżenie' }),
        ).toHaveAttribute('href', '/visits?visitId=10');
        expect(
            screen.getByRole('link', { name: 'Dermabrazja' }),
        ).toHaveAttribute('href', '/visits?visitId=7');
    });

    it('does not duplicate reschedule details when upcoming visit needs action', () => {
        const pendingAppointment = {
            id: 42,
            serviceId: 2,
            serviceName: 'Koloryzacja',
            startTime: '2026-07-15T14:30:00.000Z',
            reschedulePreviousStartTime: '2026-07-12T10:00:00.000Z',
            reschedulePreviousEndTime: '2026-07-12T12:00:00.000Z',
            employeeName: 'Aleksandra',
            status: 'rescheduled_pending',
        };
        mockedUseClientDashboard.mockReturnValueOnce({
            loading: false,
            error: null,
            refetch: refetchMock,
            data: {
                upcomingAppointment: pendingAppointment,
                pendingRescheduleAppointment: pendingAppointment,
                completedCount: 0,
                serviceHistory: [],
                recentAppointments: [pendingAppointment],
                pendingRescheduleCount: 1,
                newSalonMessageCount: 0,
            },
        } as never);

        render(<ClientDashboard />);

        expect(
            screen.getAllByText('Salon proponuje zmianę terminu'),
        ).toHaveLength(1);
        const upcomingSection = screen
            .getByRole('heading', { name: 'Nadchodząca wizyta' })
            .closest('section');
        expect(upcomingSection).not.toBeNull();
        expect(
            within(upcomingSection!).queryByText('Było'),
        ).not.toBeInTheDocument();
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
            within(recentSection!).getByText('Zalecenia po wizycie'),
        ).toBeInTheDocument();
        expect(
            within(recentSection!).getByText('myć włosy co 3 dni'),
        ).toBeInTheDocument();
        expect(
            within(recentSection!).queryByText('Koloryzacja'),
        ).not.toBeInTheDocument();
    });

    it('shows structured notes for the upcoming appointment', () => {
        render(<ClientDashboard />);

        const upcomingSection = screen
            .getByRole('heading', { name: 'Nadchodząca wizyta' })
            .closest('section');

        expect(upcomingSection).not.toBeNull();
        expect(
            within(upcomingSection!).getByText('Komentarz do rezerwacji'),
        ).toBeInTheDocument();
        expect(
            within(upcomingSection!).getByText('proszę o spokojną wizytę'),
        ).toBeInTheDocument();
        expect(
            within(upcomingSection!).getByText('Dodatkowe zabiegi'),
        ).toBeInTheDocument();
        expect(
            within(upcomingSection!).getByText('Pielęgnacja (+30 min)'),
        ).toBeInTheDocument();
        expect(
            within(upcomingSection!).getByText(
                'Salon potwierdzi łączny czas wizyty.',
            ),
        ).toBeInTheDocument();
    });
});
