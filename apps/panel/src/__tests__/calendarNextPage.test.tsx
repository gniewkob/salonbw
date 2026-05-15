import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import CalendarNextPage from '@/pages/calendar';
import type { ReactNode } from 'react';

const pushMock = jest.fn();
const apiFetchMock = jest.fn();
let consoleErrorSpy: jest.SpyInstance;
let originalConsoleError: typeof console.error;
let consoleWarnSpy: jest.SpyInstance;
const routerMock = {
    query: { appointmentId: '42' } as Record<string, string>,
    pathname: '/calendar',
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

jest.mock('@/components/calendar/ReceptionView', () => ({
    __esModule: true,
    default: ({
        appointments,
        onActionTracked,
    }: {
        appointments: Array<{ id: number }>;
        onActionTracked?: (params: {
            appointmentId: number;
            action:
                | 'open_appointment_drawer'
                | 'confirm_appointment'
                | 'start_appointment'
                | 'mark_no_show'
                | 'finalize_via_drawer';
            customerAlertSeverity?: 'info' | 'warning' | 'danger';
        }) => void;
    }) => (
        <div>
            <div>reception-view:{appointments.length}</div>
            <button
                type="button"
                onClick={() =>
                    onActionTracked?.({
                        appointmentId: 302,
                        action: 'start_appointment',
                        customerAlertSeverity: 'warning',
                    })
                }
            >
                track-alert-action
            </button>
            <button
                type="button"
                onClick={() =>
                    onActionTracked?.({
                        appointmentId: 301,
                        action: 'open_appointment_drawer',
                    })
                }
            >
                track-non-alert-action
            </button>
        </div>
    ),
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
        originalConsoleError = console.error;
        consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation((...args: unknown[]) => {
                const firstArg = args[0];
                if (
                    typeof firstArg === 'string' &&
                    firstArg.includes('not wrapped in act')
                ) {
                    return;
                }
                originalConsoleError(
                    ...(args as Parameters<typeof console.error>),
                );
            });
        consoleWarnSpy = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);
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

    afterEach(async () => {
        await act(async () => {
            await Promise.resolve();
        });
        jest.useRealTimers();
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
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

    it('shows warning when appointment deep link fetch fails', async () => {
        apiFetchMock.mockRejectedValueOnce(new Error('Deep link failed'));

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByText(
                    'Nie udało się otworzyć wizyty z linku. Spróbuj ponownie.',
                ),
            ).toBeInTheDocument(),
        );
        expect(screen.getByTestId('appointment-drawer')).toHaveTextContent(
            'closed',
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '[calendar] deep-link fetch failed',
            { appointmentId: 42 },
        );
    });

    it('opens drawer from calendar event map without fallback fetch', async () => {
        useCalendarMock.mockImplementation(() => ({
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
        }));

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
                    pathname: '/calendar',
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

    it('renders reception agenda view when view=reception', async () => {
        routerMock.query = { view: 'reception' };
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [{ customerId: 7, statistics: { noShowVisits: 0 } }],
                };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 200,
                        type: 'appointment',
                        title: 'Wizyta recepcja',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 7,
                        clientName: 'Ola',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        render(<CalendarNextPage />);

        expect(screen.getByText('reception-view:1')).toBeInTheDocument();
        expect(screen.queryByText('calendar-view')).not.toBeInTheDocument();
        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining(
                    '/customers/statistics/batch?ids=7&scope=alerts',
                ),
            ),
        );
        expect(apiFetchMock).not.toHaveBeenCalledWith(
            '/customers/7/statistics',
        );
    });

    it('shows warning when customer CRM stats are temporarily unavailable', async () => {
        routerMock.query = { view: 'reception' };
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint === '/customers/7/statistics') {
                throw new Error('Stats temporary failure');
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 200,
                        type: 'appointment',
                        title: 'Wizyta recepcja',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 7,
                        clientName: 'Ola',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByText(
                    'Część alertów CRM jest chwilowo niedostępna. Spróbujemy ponownie przy kolejnym odświeżeniu widoku.',
                ),
            ).toBeInTheDocument(),
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '[calendar] customer alert stats fetch failed',
            {
                failedCustomerIds: [7],
                failedCount: 1,
            },
        );
    });

    it('retries customer CRM stats fetch when user clicks "Ponów teraz"', async () => {
        routerMock.query = { view: 'reception' };
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint === '/customers/7/statistics') {
                throw new Error('Stats temporary failure');
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 200,
                        type: 'appointment',
                        title: 'Wizyta recepcja',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 7,
                        clientName: 'Ola',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: 'Ponów teraz' }),
            ).toBeInTheDocument(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'Ponów teraz' }));

        await waitFor(() => {
            const statsCalls = apiFetchMock.mock.calls.filter(
                (call: unknown[]) => call[0] === '/customers/7/statistics',
            );
            expect(statsCalls.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('applies reception filters for status, payment and CRM alerts', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-07T12:00:00.000Z'));
        routerMock.query = { view: 'reception' };

        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 301,
                        type: 'appointment',
                        title: 'A',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 11,
                        clientName: 'Klient 11',
                        status: 'scheduled',
                    },
                    {
                        id: 302,
                        type: 'appointment',
                        title: 'B',
                        startTime: '2026-05-07T10:00:00.000Z',
                        endTime: '2026-05-07T10:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 12,
                        clientName: 'Klient 12',
                        status: 'in_progress',
                    },
                    {
                        id: 303,
                        type: 'appointment',
                        title: 'C',
                        startTime: '2026-05-07T11:00:00.000Z',
                        endTime: '2026-05-07T11:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 13,
                        clientName: 'Klient 13',
                        status: 'completed',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint === '/customers/11/statistics')
                return { noShowVisits: 0 };
            if (endpoint === '/customers/12/statistics')
                return { noShowVisits: 2 };
            if (endpoint === '/customers/13/statistics')
                return { noShowVisits: 0 };
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(screen.getByText('reception-view:3')).toBeInTheDocument(),
        );

        fireEvent.change(screen.getByLabelText('Status'), {
            target: { value: 'in_progress' },
        });
        expect(screen.getByText('reception-view:1')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Status'), {
            target: { value: 'all' },
        });
        fireEvent.change(screen.getByLabelText('Płatność'), {
            target: { value: 'to_finalize' },
        });
        expect(screen.getByText('reception-view:1')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Płatność'), {
            target: { value: 'all' },
        });
        fireEvent.click(screen.getByLabelText('Tylko z alertem CRM'));

        await waitFor(() =>
            expect(screen.getByText('reception-view:1')).toBeInTheDocument(),
        );

        fireEvent.click(screen.getByLabelText('Tylko z alertem CRM'));
        fireEvent.click(screen.getByLabelText('Tylko priorytetowe'));

        await waitFor(() =>
            expect(screen.getByText('reception-view:2')).toBeInTheDocument(),
        );
        await waitFor(() => {
            const statsCalls = apiFetchMock.mock.calls
                .map((call) => String(call[0]))
                .filter((endpoint) => endpoint.startsWith('/customers/'));
            expect(statsCalls).toEqual(
                expect.arrayContaining([
                    '/customers/11/statistics',
                    '/customers/12/statistics',
                    '/customers/13/statistics',
                ]),
            );
        });
    });

    it('renders daily reception summary counters without double counting across filters', async () => {
        routerMock.query = { view: 'reception' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 401,
                        type: 'appointment',
                        title: 'S1',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 21,
                        clientName: 'Klient 21',
                        status: 'in_progress',
                    },
                    {
                        id: 402,
                        type: 'appointment',
                        title: 'S2',
                        startTime: '2026-05-07T10:00:00.000Z',
                        endTime: '2026-05-07T10:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 22,
                        clientName: 'Klient 22',
                        status: 'no_show',
                    },
                    {
                        id: 403,
                        type: 'appointment',
                        title: 'S3',
                        startTime: '2026-05-07T11:00:00.000Z',
                        endTime: '2026-05-07T11:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 23,
                        clientName: 'Klient 23',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 21, statistics: { noShowVisits: 0 } },
                        { customerId: 22, statistics: { noShowVisits: 2 } },
                        { customerId: 23, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        const summary = screen.getByTestId('reception-daily-summary');
        const readSummaryValue = (label: string) => {
            const labelElement = Array.from(
                summary.querySelectorAll('.small.text-muted'),
            ).find((element) => element.textContent?.trim() === label);
            const card = labelElement?.closest('.border.rounded.p-2.h-100');
            return (
                card?.querySelector('.fw-semibold')?.textContent?.trim() ?? null
            );
        };
        await waitFor(() =>
            expect(summary).toHaveTextContent('Do finalizacji'),
        );
        expect(summary).toHaveTextContent('No-show');
        expect(summary).toHaveTextContent('Z alertem CRM');
        expect(summary).toHaveTextContent('Akcje na alertach');
        expect(readSummaryValue('Do finalizacji')).toBe('1');
        expect(readSummaryValue('No-show')).toBe('1');
        await waitFor(() =>
            expect(readSummaryValue('Z alertem CRM')).toBe('1'),
        );
        expect(readSummaryValue('Akcje na alertach')).toBe('0');

        fireEvent.change(screen.getByLabelText('Status'), {
            target: { value: 'in_progress' },
        });
        expect(screen.getByText('reception-view:1')).toBeInTheDocument();
        // Summary should be based on all daily appointments, not filtered list.
        expect(readSummaryValue('Do finalizacji')).toBe('1');
        expect(readSummaryValue('No-show')).toBe('1');
        expect(readSummaryValue('Z alertem CRM')).toBe('1');

        fireEvent.click(
            screen.getByRole('button', { name: 'track-alert-action' }),
        );
        expect(readSummaryValue('Akcje na alertach')).toBe('1');

        fireEvent.click(
            screen.getByRole('button', { name: 'track-non-alert-action' }),
        );
        // Non-alert action should not increment the metric.
        expect(readSummaryValue('Akcje na alertach')).toBe('1');
    });

    it('uses persisted reception summary baseline and increments alert actions locally', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 451,
                        type: 'appointment',
                        title: 'Persisted',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 31,
                        clientName: 'Klient 31',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 31, statistics: { noShowVisits: 1 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 10,
                    actionsOnAlerts: 4,
                };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);
        const summary = screen.getByTestId('reception-daily-summary');
        const readSummaryValue = (label: string) => {
            const labelElement = Array.from(
                summary.querySelectorAll('.small.text-muted'),
            ).find((element) => element.textContent?.trim() === label);
            const card = labelElement?.closest('.border.rounded.p-2.h-100');
            return (
                card?.querySelector('.fw-semibold')?.textContent?.trim() ?? null
            );
        };

        await waitFor(() =>
            expect(readSummaryValue('Akcje na alertach')).toBe('4'),
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'track-alert-action' }),
        );
        expect(readSummaryValue('Akcje na alertach')).toBe('5');
    });

    it('falls back to frontend-only counter when persisted summary endpoint fails', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 461,
                        type: 'appointment',
                        title: 'Fallback',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 41,
                        clientName: 'Klient 41',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 41, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                throw new Error('summary unavailable');
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        const summary = screen.getByTestId('reception-daily-summary');
        const readSummaryValue = (label: string) => {
            const labelElement = Array.from(
                summary.querySelectorAll('.small.text-muted'),
            ).find((element) => element.textContent?.trim() === label);
            const card = labelElement?.closest('.border.rounded.p-2.h-100');
            return (
                card?.querySelector('.fw-semibold')?.textContent?.trim() ?? null
            );
        };

        await waitFor(() =>
            expect(readSummaryValue('Akcje na alertach')).toBe('0'),
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'track-alert-action' }),
        );
        expect(readSummaryValue('Akcje na alertach')).toBe('1');
    });

    it('renders reception insights panel from persisted range endpoint', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 471,
                        type: 'appointment',
                        title: 'Insights',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 51,
                        clientName: 'Klient 51',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 51, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 8,
                    actionsOnAlerts: 2,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 30,
                        actionsOnAlerts: 9,
                        alertActionRate: 0.3,
                    },
                    byAction: [
                        {
                            action: 'start_appointment',
                            actionsTotal: 10,
                            actionsOnAlerts: 4,
                            alertActionRate: 0.4,
                        },
                        {
                            action: 'confirm_appointment',
                            actionsTotal: 8,
                            actionsOnAlerts: 2,
                            alertActionRate: 0.25,
                        },
                    ],
                    byDay: [
                        {
                            day: '2026-05-06',
                            actionsTotal: 5,
                            actionsOnAlerts: 1,
                            alertActionRate: 0.2,
                        },
                        {
                            day: '2026-05-07',
                            actionsTotal: 6,
                            actionsOnAlerts: 2,
                            alertActionRate: 0.33,
                        },
                    ],
                };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('reception-insights-panel'),
            ).toHaveTextContent('Insights operacyjne (7 dni)'),
        );
        expect(screen.getByText('Akcje łącznie')).toBeInTheDocument();
        expect(screen.getByText('% akcji na alertach')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument();
        expect(
            apiFetchMock.mock.calls.some(
                (call: unknown[]) =>
                    String(call[0]).startsWith(
                        '/reception/operational-insights?from=',
                    ) && String(call[0]).includes('&to='),
            ),
        ).toBe(true);
    });

    it('shows neutral reception insights fallback when range endpoint fails', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 481,
                        type: 'appointment',
                        title: 'Insights fallback',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 52,
                        clientName: 'Klient 52',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 52, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                throw new Error('insights unavailable');
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByText('Brak danych dla wybranego zakresu.'),
            ).toBeInTheDocument(),
        );
    });

    it('renders follow-up action audit panel from persisted range endpoint', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 491,
                        type: 'appointment',
                        title: 'Follow-up audit',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 53,
                        clientName: 'Klient 53',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 53, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 0,
                        actionsOnAlerts: 0,
                        alertActionRate: 0,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-actions?from=')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    actionsTotal: 6,
                    byAction: [
                        { action: 'contacted', count: 3 },
                        { action: 'deferred', count: 2 },
                    ],
                    byReason: [{ reason: 'recent_no_show', count: 4 }],
                    byDay: [{ day: '2026-05-07', count: 2 }],
                };
            }
            return [];
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('reception-follow-up-audit-panel'),
            ).toHaveTextContent('Audyt follow-up (7 dni)'),
        );
        expect(screen.getByText('Akcje follow-up łącznie')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('Kontakt wykonany')).toBeInTheDocument();
        expect(screen.getByText('Niedawne no-show')).toBeInTheDocument();
        expect(screen.getByText('2026-05-07')).toBeInTheDocument();
    });

    it('shows follow-up audit fallback when audit endpoint fails', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 492,
                        type: 'appointment',
                        title: 'Follow-up audit fallback',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 54,
                        clientName: 'Klient 54',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 54, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 0,
                        actionsOnAlerts: 0,
                        alertActionRate: 0,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-actions?from=')) {
                throw new Error('audit unavailable');
            }
            return [];
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByText('Audyt follow-up chwilowo niedostępny.'),
            ).toBeInTheDocument(),
        );
    });

    it('normalizes malformed follow-up audit payloads safely', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 493,
                        type: 'appointment',
                        title: 'Follow-up audit malformed',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 55,
                        clientName: 'Klient 55',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 55, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 0,
                        actionsOnAlerts: 0,
                        alertActionRate: 0,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-actions?from=')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    actionsTotal: 5,
                    byAction: [
                        { action: 'contacted', count: 2 },
                        { action: 'contacted', count: 5 },
                        { action: '', count: -4 },
                    ],
                    byReason: [
                        { reason: 'recent_no_show', count: 1 },
                        { reason: 'recent_no_show', count: 9 },
                        { reason: null, count: 2 },
                    ],
                    byDay: [
                        { day: '2026-05-07', count: 1 },
                        { day: '2026-05-07', count: 8 },
                        { day: undefined, count: 3 },
                    ],
                };
            }
            return [];
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('reception-follow-up-audit-panel'),
            ).toHaveTextContent('Audyt follow-up (7 dni)'),
        );

        // dedup + clamp by action => contacted 2 + 5 clamped to max actionsTotal(5)
        expect(screen.getByText('Kontakt wykonany')).toBeInTheDocument();
        expect(screen.getByText('Inna akcja')).toBeInTheDocument();
        // fallback reason label for malformed reason
        expect(screen.getByText('Inny powód')).toBeInTheDocument();
        // dedup by day and fallback key for malformed day
        expect(screen.getByText('2026-05-07')).toBeInTheDocument();
        expect(screen.getByText('-')).toBeInTheDocument();
        expect(
            screen.queryByText(/undefined|\bNaN\b/i),
        ).not.toBeInTheDocument();
    });

    it('renders follow-up candidates panel and supports open actions', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 601,
                        type: 'appointment',
                        title: 'Follow-up',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 81,
                        clientName: 'Klient 81',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 81, statistics: { noShowVisits: 2 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 2,
                    actionsOnAlerts: 1,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 5,
                        actionsOnAlerts: 2,
                        alertActionRate: 0.4,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-candidates')) {
                return [
                    {
                        customerId: 81,
                        appointmentId: 601,
                        reason: 'recent_no_show',
                        priority: 'high',
                        suggestedAction: 'contact_customer',
                    },
                ];
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('reception-follow-up-panel'),
            ).toHaveTextContent('Kandydaci follow-up CRM'),
        );
        expect(screen.getByText('Klient #81')).toBeInTheDocument();
        expect(screen.getByText('Niedawne no-show')).toBeInTheDocument();
        expect(
            screen.getByText('Sugerowana akcja: contact_customer'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByText('Otwórz wizytę #601'));
        await waitFor(() =>
            expect(pushMock).toHaveBeenCalledWith(
                {
                    pathname: '/calendar',
                    query: {
                        view: 'reception',
                        date: '2026-05-07',
                        appointmentId: '601',
                    },
                },
                undefined,
                { shallow: true },
            ),
        );

        fireEvent.click(screen.getByText('Otwórz klienta'));
        await waitFor(() =>
            expect(pushMock).toHaveBeenCalledWith('/customers/81'),
        );
    });

    it('captures follow-up action and marks candidate as handled on success', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 611,
                        type: 'appointment',
                        title: 'Follow-up action success',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 91,
                        clientName: 'Klient 91',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 91, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 0,
                        actionsOnAlerts: 0,
                        alertActionRate: 0,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-candidates')) {
                return [
                    {
                        customerId: 91,
                        appointmentId: 611,
                        reason: 'recent_no_show',
                        priority: 'high',
                        suggestedAction: 'contact_customer',
                    },
                ];
            }
            if (endpoint === '/crm/follow-up-actions') {
                return { id: 1 };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(screen.getByText('Klient #91')).toBeInTheDocument(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'Oznacz kontakt' }));

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/crm/follow-up-actions',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }),
            ),
        );
        await waitFor(() =>
            expect(
                screen.getByText('Wykonano: Kontakt wykonany'),
            ).toBeInTheDocument(),
        );
    });

    it('shows non-blocking error when follow-up action capture fails', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 612,
                        type: 'appointment',
                        title: 'Follow-up action failure',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 92,
                        clientName: 'Klient 92',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 92, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 0,
                        actionsOnAlerts: 0,
                        alertActionRate: 0,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-candidates')) {
                return [
                    {
                        customerId: 92,
                        appointmentId: 612,
                        reason: 'stale_in_progress',
                        priority: 'critical',
                        suggestedAction: 'finalize_or_update_status',
                    },
                ];
            }
            if (endpoint === '/crm/follow-up-actions') {
                throw new Error('save failed');
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(screen.getByText('Klient #92')).toBeInTheDocument(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'Odrocz' }));

        await waitFor(() =>
            expect(
                screen.getByText('Nie udało się zapisać akcji follow-up.'),
            ).toBeInTheDocument(),
        );
        expect(screen.getByText('Klient #92')).toBeInTheDocument();
    });

    it('shows neutral follow-up fallback when endpoint fails', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 602,
                        type: 'appointment',
                        title: 'Follow-up error',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 82,
                        clientName: 'Klient 82',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 82, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 0,
                        actionsOnAlerts: 0,
                        alertActionRate: 0,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-candidates')) {
                throw new Error('follow-up unavailable');
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByText('Kandydaci follow-up chwilowo niedostępni.'),
            ).toBeInTheDocument(),
        );
    });

    it('normalizes malformed follow-up payload and deduplicates customer+reason', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 603,
                        type: 'appointment',
                        title: 'Follow-up malformed',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 83,
                        clientName: 'Klient 83',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 83, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 0,
                        actionsOnAlerts: 0,
                        alertActionRate: 0,
                    },
                    byAction: [],
                    byDay: [],
                };
            }
            if (endpoint.startsWith('/crm/follow-up-candidates')) {
                return [
                    {
                        customerId: 83,
                        appointmentId: 603,
                        reason: 'recent_no_show',
                        priority: 'high',
                        suggestedAction: 'contact_customer',
                    },
                    {
                        customerId: 83,
                        appointmentId: 604,
                        reason: 'recent_no_show',
                        priority: 'critical',
                        suggestedAction: '',
                    },
                    {
                        customerId: 'oops',
                        appointmentId: 605,
                        reason: 'stale_in_progress',
                        priority: 'critical',
                        suggestedAction: 'finalize',
                    },
                    {
                        customerId: 84,
                        appointmentId: -1,
                        reason: 'legacy_unknown_reason',
                        priority: 'legacy_unknown_priority',
                    },
                ];
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('reception-follow-up-panel'),
            ).toHaveTextContent('Kandydaci follow-up CRM'),
        );

        expect(screen.getByText('Klient #83')).toBeInTheDocument();
        expect(screen.getByText('Klient #84')).toBeInTheDocument();
        expect(screen.getByText('Krytyczny')).toBeInTheDocument();
        expect(screen.getByText('Średni')).toBeInTheDocument();
        expect(
            screen.getByText('Wysokie ryzyko bez kontaktu'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText('Sugerowana akcja: review_customer_timeline'),
        ).toHaveLength(2);
        expect(screen.queryByText('Otwórz wizytę #-1')).not.toBeInTheDocument();
        expect(screen.getAllByText('Klient #83')).toHaveLength(1);
    });

    it('renders actionable recommendations and CTA updates reception filters', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 501,
                        type: 'appointment',
                        title: 'Alerted',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 61,
                        clientName: 'Klient 61',
                        status: 'scheduled',
                    },
                    {
                        id: 502,
                        type: 'appointment',
                        title: 'No alert',
                        startTime: '2026-05-07T10:00:00.000Z',
                        endTime: '2026-05-07T10:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 62,
                        clientName: 'Klient 62',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 61, statistics: { noShowVisits: 2 } },
                        { customerId: 62, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 12,
                    actionsOnAlerts: 7,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 20,
                        actionsOnAlerts: 12,
                        alertActionRate: 0.6,
                    },
                    byAction: [
                        {
                            action: 'start_appointment',
                            actionsTotal: 7,
                            actionsOnAlerts: 4,
                            alertActionRate: 0.57,
                        },
                    ],
                    byDay: [
                        {
                            day: '2026-05-06',
                            actionsTotal: 10,
                            actionsOnAlerts: 3,
                            alertActionRate: 0.3,
                        },
                        {
                            day: '2026-05-07',
                            actionsTotal: 10,
                            actionsOnAlerts: 5,
                            alertActionRate: 0.5,
                        },
                    ],
                };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByText('Włącz filtr Tylko priorytetowe'),
            ).toBeInTheDocument(),
        );
        expect(
            screen.getByText('Przejdź do wizyt z alertem CRM'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Sprawdź wizyty do finalizacji'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText('Przejdź do wizyt z alertem CRM'),
        ).toHaveLength(1);
        expect(
            screen.getByText('60% akcji dotyczy alertów CRM.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Udział alertów wzrósł z 30% do 50%.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Najczęstsza akcja: rozpoczęcie wizyty.'),
        ).toBeInTheDocument();
        expect(screen.getByText('reception-view:2')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Przejdź do wizyt z alertem CRM'));
        await waitFor(() =>
            expect(screen.getByText('reception-view:1')).toBeInTheDocument(),
        );
        expect(
            screen.getByRole('button', {
                name: 'Przejdź do wizyt z alertem CRM',
            }),
        ).toBeDisabled();
    });

    it('shows no urgent recommendations for neutral insights', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 511,
                        type: 'appointment',
                        title: 'Neutral',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 71,
                        clientName: 'Klient 71',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));
        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 71, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 3,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 10,
                        actionsOnAlerts: 2,
                        alertActionRate: 0.2,
                    },
                    byAction: [
                        {
                            action: 'open_appointment_drawer',
                            actionsTotal: 6,
                            actionsOnAlerts: 1,
                            alertActionRate: 0.16,
                        },
                    ],
                    byDay: [
                        {
                            day: '2026-05-06',
                            actionsTotal: 5,
                            actionsOnAlerts: 1,
                            alertActionRate: 0.2,
                        },
                        {
                            day: '2026-05-07',
                            actionsTotal: 5,
                            actionsOnAlerts: 1,
                            alertActionRate: 0.2,
                        },
                    ],
                };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByText('Brak pilnych rekomendacji.'),
            ).toBeInTheDocument(),
        );
    });

    it('normalizes malformed insights payload to safe values', async () => {
        routerMock.query = { view: 'reception', date: '2026-05-07' };
        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 491,
                        type: 'appointment',
                        title: 'Insights malformed',
                        startTime: '2026-05-07T09:00:00.000Z',
                        endTime: '2026-05-07T09:45:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 53,
                        clientName: 'Klient 53',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return {
                    items: [
                        { customerId: 53, statistics: { noShowVisits: 0 } },
                    ],
                };
            }
            if (endpoint.startsWith('/reception/operational-summary')) {
                return {
                    date: '2026-05-07',
                    actionsTotal: 0,
                    actionsOnAlerts: 0,
                };
            }
            if (endpoint.startsWith('/reception/operational-insights')) {
                return {
                    from: '2026-05-01',
                    to: '2026-05-07',
                    summary: {
                        actionsTotal: 10,
                        actionsOnAlerts: 20,
                        alertActionRate: 700,
                    },
                    byAction: [
                        {
                            action: 'start_appointment',
                            actionsTotal: -1,
                            actionsOnAlerts: 4,
                            alertActionRate: -5,
                        },
                    ],
                    byDay: [
                        {
                            day: '2026-05-07',
                            actionsTotal: 3,
                            actionsOnAlerts: 4,
                            alertActionRate: 200,
                        },
                    ],
                };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('reception-insights-panel'),
            ).toHaveTextContent('Insights operacyjne (7 dni)'),
        );

        // summary actionsOnAlerts clamped to actionsTotal -> 10/10 = 100%
        expect(screen.getByText('100%')).toBeInTheDocument();
        // byAction with negative total normalized to zero
        expect(screen.getByText('start_appointment')).toBeInTheDocument();
        expect(screen.getByText('(0)')).toBeInTheDocument();
        // byDay clamped to 3/3
        expect(screen.getByText('2026-05-07')).toBeInTheDocument();
        expect(screen.getByText('(3/3)')).toBeInTheDocument();
        expect(screen.queryByText(/undefined|NaN/i)).not.toBeInTheDocument();
    });

    it('guards concurrent customer stats fetches and retries after failure', async () => {
        routerMock.query = {};

        let events = [
            {
                id: 401,
                type: 'appointment',
                title: 'Wizyta A',
                startTime: '2026-05-07T09:00:00.000Z',
                endTime: '2026-05-07T09:45:00.000Z',
                employeeId: 2,
                employeeName: 'Anna',
                clientId: 99,
                clientName: 'Klient 99',
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

        let resolveFirst: ((value: { noShowVisits: number }) => void) | null =
            null;
        const firstPending = new Promise<{ noShowVisits: number }>(
            (resolve) => {
                resolveFirst = resolve;
            },
        );
        let firstCall = true;

        apiFetchMock.mockImplementation((endpoint: string) => {
            if (endpoint === '/customers/99/statistics') {
                if (firstCall) {
                    firstCall = false;
                    return firstPending;
                }
                return Promise.resolve({ noShowVisits: 1 });
            }
            return Promise.resolve({
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            });
        });

        const { rerender } = render(<CalendarNextPage />);

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/customers/99/statistics',
            ),
        );

        // Re-render while the first fetch is still pending: should not trigger a duplicate call.
        events = [{ ...events[0], id: 402, title: 'Wizyta B' }];
        rerender(<CalendarNextPage />);

        const callsDuringPending = apiFetchMock.mock.calls.filter(
            (call: unknown[]) => call[0] === '/customers/99/statistics',
        );
        expect(callsDuringPending).toHaveLength(1);

        resolveFirst?.({ noShowVisits: 0 });
        await waitFor(() => {
            const callsAfterResolve = apiFetchMock.mock.calls.filter(
                (call: unknown[]) => call[0] === '/customers/99/statistics',
            );
            expect(callsAfterResolve).toHaveLength(1);
        });

        // Failure should not be cached forever: changing to a fresh view should retry.
        apiFetchMock.mockImplementation((endpoint: string) => {
            if (endpoint === '/customers/100/statistics') {
                return Promise.reject(new Error('Temporary stats failure'));
            }
            return Promise.resolve({
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            });
        });

        events = [
            {
                id: 403,
                type: 'appointment',
                title: 'Wizyta C',
                startTime: '2026-05-07T12:00:00.000Z',
                endTime: '2026-05-07T12:45:00.000Z',
                employeeId: 2,
                employeeName: 'Anna',
                clientId: 100,
                clientName: 'Klient 100',
                status: 'scheduled',
            },
        ];
        rerender(<CalendarNextPage />);
        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/customers/100/statistics',
            ),
        );

        // Trigger another render with the same failing customer; retry should happen.
        events = [{ ...events[0], id: 404, title: 'Wizyta D' }];
        rerender(<CalendarNextPage />);

        await waitFor(() => {
            const retryCalls = apiFetchMock.mock.calls.filter(
                (call: unknown[]) => call[0] === '/customers/100/statistics',
            );
            expect(retryCalls.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('keeps per-customer fallback pending guard when batch request fails', async () => {
        routerMock.query = {};

        let events = [
            {
                id: 801,
                type: 'appointment',
                title: 'Wizyta fallback',
                startTime: '2026-05-07T09:00:00.000Z',
                endTime: '2026-05-07T09:45:00.000Z',
                employeeId: 2,
                employeeName: 'Anna',
                clientId: 7,
                clientName: 'Klient 7',
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

        let resolveFallback:
            | ((value: { noShowVisits: number }) => void)
            | null = null;
        const pendingFallback = new Promise<{ noShowVisits: number }>(
            (resolve) => {
                resolveFallback = resolve;
            },
        );

        apiFetchMock.mockImplementation((endpoint: string) => {
            if (endpoint.startsWith('/customers/statistics/batch')) {
                return Promise.reject(new Error('Batch failed'));
            }
            if (endpoint === '/customers/7/statistics') {
                return pendingFallback;
            }
            return Promise.resolve({
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            });
        });

        const { rerender } = render(<CalendarNextPage />);

        await waitFor(() => {
            const batchCalls = apiFetchMock.mock.calls.filter((call) =>
                String(call[0]).startsWith('/customers/statistics/batch'),
            );
            expect(batchCalls.length).toBeGreaterThanOrEqual(1);
        });

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/customers/7/statistics',
            ),
        );

        events = [{ ...events[0], id: 802, title: 'Wizyta fallback rerender' }];
        rerender(<CalendarNextPage />);

        const fallbackCallsDuringPending = apiFetchMock.mock.calls.filter(
            (call: unknown[]) => call[0] === '/customers/7/statistics',
        );
        expect(fallbackCallsDuringPending).toHaveLength(1);

        resolveFallback?.({ noShowVisits: 0 });

        await waitFor(() => {
            const fallbackCallsAfterResolve = apiFetchMock.mock.calls.filter(
                (call: unknown[]) => call[0] === '/customers/7/statistics',
            );
            expect(fallbackCallsAfterResolve).toHaveLength(1);
        });
    });

    it('updates reception priority filter results after time tick', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-07T12:00:00.000Z'));
        routerMock.query = { view: 'reception' };

        useCalendarMock.mockImplementation(() => ({
            data: {
                events: [
                    {
                        id: 501,
                        type: 'appointment',
                        title: 'Wizyta tick',
                        startTime: '2026-05-07T12:30:00.000Z',
                        endTime: '2026-05-07T13:00:00.000Z',
                        employeeId: 2,
                        employeeName: 'Anna',
                        clientId: 51,
                        clientName: 'Klient Tick',
                        status: 'scheduled',
                    },
                ],
                employees: [],
                dateRange: { start: '2026-01-01', end: '2026-01-02' },
            },
            loading: false,
            refetch: jest.fn(),
        }));

        apiFetchMock.mockImplementation(async (endpoint: string) => {
            if (endpoint === '/customers/51/statistics') {
                return { noShowVisits: 0 };
            }
            return {
                id: 42,
                startTime: '2026-05-07T10:00:00.000Z',
                endTime: '2026-05-07T10:45:00.000Z',
                status: 'scheduled',
            };
        });

        render(<CalendarNextPage />);

        await waitFor(() =>
            expect(screen.getByText('reception-view:1')).toBeInTheDocument(),
        );

        fireEvent.click(screen.getByLabelText('Tylko priorytetowe'));
        expect(screen.getByText('reception-view:0')).toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(31 * 60 * 1000);
        });

        await waitFor(() =>
            expect(screen.getByText('reception-view:1')).toBeInTheDocument(),
        );
    });
});
