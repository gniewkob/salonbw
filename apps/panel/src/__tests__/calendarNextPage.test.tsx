import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CalendarNextPage from '@/pages/calendar-next';
import type { ReactNode } from 'react';

const pushMock = jest.fn();
const apiFetchMock = jest.fn();
const routerMock = {
    query: { appointmentId: '42' } as Record<string, string>,
    pathname: '/calendar-next',
    push: pushMock,
};

jest.mock('next/router', () => ({
    useRouter: () => routerMock,
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
        onClose,
    }: {
        open: boolean;
        appointment?: { id?: number } | null;
        onClose: () => void;
    }) => (
        <div data-testid="appointment-drawer">
            {open ? `open:${appointment?.id ?? 'none'}` : 'closed'}
            <button type="button" onClick={onClose}>
                close-drawer
            </button>
        </div>
    ),
}));

describe('CalendarNextPage', () => {
    beforeEach(() => {
        pushMock.mockReset();
        apiFetchMock.mockReset();
        useCalendarMock.mockReset();
        routerMock.query = { appointmentId: '42' };
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

    it('clears appointmentId from URL when drawer is closed', async () => {
        routerMock.query = {
            appointmentId: '42',
            date: '2026-05-07',
            view: 'day',
        };

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(screen.getByTestId('appointment-drawer')).toHaveTextContent(
                'open:42',
            ),
        );

        fireEvent.click(screen.getByRole('button', { name: 'close-drawer' }));

        await waitFor(() =>
            expect(pushMock).toHaveBeenCalledWith(
                {
                    pathname: '/calendar-next',
                    query: { date: '2026-05-07', view: 'day' },
                },
                undefined,
                { shallow: true },
            ),
        );
    });

    it('reuses cached customer alert stats and fetches only missing customers', async () => {
        routerMock.query = {};

        let events = [
            {
                id: 100,
                type: 'appointment',
                title: 'Wizyta 1',
                startTime: '2026-05-07T09:00:00.000Z',
                endTime: '2026-05-07T09:45:00.000Z',
                employeeId: 2,
                employeeName: 'Anna',
                clientId: 5,
                clientName: 'Jan Kowalski',
                status: 'scheduled',
            },
        ];

        useCalendarMock.mockImplementation(() => ({
            data: {
                events,
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint === '/customers/5/statistics') {
                return { noShowVisits: 1 };
            }
            if (endpoint === '/customers/6/statistics') {
                return { noShowVisits: 2 };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        const { rerender } = render(<CalendarNextPage />);

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/customers/5/statistics',
            ),
        );

        // Same customer in a new render should be served from cache.
        events = [
            {
                ...events[0],
                id: 101,
                title: 'Wizyta 2',
            },
        ];
        rerender(<CalendarNextPage />);

        await waitFor(() => {
            const customer5Calls = apiFetchMock.mock.calls.filter(
                (call: unknown[]) => call[0] === '/customers/5/statistics',
            );
            expect(customer5Calls).toHaveLength(1);
        });

        // Adding a new customer should fetch only the missing customer.
        events = [
            ...events,
            {
                id: 102,
                type: 'appointment',
                title: 'Wizyta 3',
                startTime: '2026-05-07T11:00:00.000Z',
                endTime: '2026-05-07T11:45:00.000Z',
                employeeId: 2,
                employeeName: 'Anna',
                clientId: 6,
                clientName: 'Adam Nowak',
                status: 'scheduled',
            },
        ];
        rerender(<CalendarNextPage />);

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/customers/6/statistics',
            ),
        );
    });
});
