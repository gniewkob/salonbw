import { render, screen, waitFor } from '@testing-library/react';
import CalendarNextPage from '@/pages/calendar-next';
import type { ReactNode } from 'react';

const pushMock = jest.fn();
const apiFetchMock = jest.fn();

jest.mock('next/router', () => ({
    useRouter: () => ({
        query: { appointmentId: '42' },
        pathname: '/calendar-next',
        push: pushMock,
    }),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        role: 'admin',
        apiFetch: apiFetchMock,
    }),
}));

jest.mock('@/components/RouteGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonShell', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonBreadcrumbs', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('@/components/calendar/CalendarView', () => ({
    __esModule: true,
    default: () => <div>calendar-view</div>,
}));

const useCalendarMock = jest.fn();

jest.mock('@/hooks/useCalendar', () => ({
    useCalendar: (...args: unknown[]) => useCalendarMock(...args),
    useCalendarMutations: () => ({
        rescheduleAppointment: { mutateAsync: jest.fn() },
        checkConflicts: jest.fn().mockResolvedValue({ hasConflict: false }),
    }),
}));

jest.mock('@/components/calendar/AppointmentDrawer', () => ({
    __esModule: true,
    default: ({
        open,
        appointment,
    }: {
        open: boolean;
        appointment?: { id?: number } | null;
    }) => (
        <div data-testid="appointment-drawer">
            {open ? `open:${appointment?.id ?? 'none'}` : 'closed'}
        </div>
    ),
}));

describe('CalendarNextPage', () => {
    beforeEach(() => {
        pushMock.mockReset();
        apiFetchMock.mockReset();
        useCalendarMock.mockReset();
        apiFetchMock.mockResolvedValue({
            id: 42,
            startTime: '2026-05-07T10:00:00.000Z',
            endTime: '2026-05-07T10:45:00.000Z',
            status: 'scheduled',
        });
        useCalendarMock.mockReturnValue({
            data: {
                events: [],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        });
    });

    it('opens appointment drawer from appointmentId deep link', async () => {
        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith('/appointments/42'),
        );
        await waitFor(() =>
            expect(screen.getByTestId('appointment-drawer')).toHaveTextContent(
                'open:42',
            ),
        );
    });

    it('opens drawer from calendar event map without fallback fetch', async () => {
        useCalendarMock.mockReturnValueOnce({
            data: {
                events: [
                    {
                        id: 42,
                        type: 'appointment',
                        title: 'Strzyżenie',
                        startTime: '2026-05-07T10:00:00.000Z',
                        endTime: '2026-05-07T10:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 5,
                        clientName: 'Jan Kowalski',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(screen.getByTestId('appointment-drawer')).toHaveTextContent(
                'open:42',
            ),
        );
        expect(apiFetchMock).not.toHaveBeenCalledWith('/appointments/42');
    });
});
