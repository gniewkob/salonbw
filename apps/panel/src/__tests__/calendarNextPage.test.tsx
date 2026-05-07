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

jest.mock('@/hooks/useCalendar', () => ({
    useCalendar: () => ({
        data: {
            events: [],
            employees: [],
            dateRange: { start: '2026-01-01', end: '2026-01-02' },
        },
        loading: false,
        refetch: jest.fn(),
    }),
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
        apiFetchMock.mockResolvedValue({
            id: 42,
            startTime: '2026-05-07T10:00:00.000Z',
            endTime: '2026-05-07T10:45:00.000Z',
            status: 'scheduled',
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
});
