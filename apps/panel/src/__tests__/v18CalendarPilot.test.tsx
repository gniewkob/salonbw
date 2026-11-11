import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';
import type { CalendarEvent } from '@/types';
import {
    V18CalendarPilot,
    getServerSideProps,
    parseCalendarDate,
} from '@/pages/studio-v18/calendar';

jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useCalendar', () => ({
    useCalendar: jest.fn(),
    useCalendarMutations: jest.fn(),
}));
const conflictsMock = jest.fn();
const rescheduleMock = jest.fn();
const revertMock = jest.fn();
jest.mock('@/components/calendar/CalendarView', () => ({
    __esModule: true,
    default: ({
        onEventClick,
        onTimeSlotClick,
        onDateSelect,
        readOnly,
        dragOnly,
        onEventDrop,
    }: {
        onEventClick: (event: CalendarEvent) => void;
        onTimeSlotClick?: (start: Date) => void;
        onDateSelect: (start: Date, end: Date) => void;
        readOnly?: boolean;
        dragOnly?: boolean;
        onEventDrop: (
            id: number,
            start: Date,
            end: Date,
            employeeId?: number,
            revert?: () => void,
        ) => void;
    }) => (
        <div
            data-testid="shared-calendar"
            data-readonly={String(readOnly)}
            data-dragonly={String(dragOnly)}
        >
            <button type="button" onClick={() => onEventClick(eventFixture)}>
                Otwórz przykładową wizytę
            </button>
            <button
                type="button"
                onClick={() =>
                    onEventDrop(
                        301,
                        new Date('2026-11-11T09:00:00.000Z'),
                        new Date('2026-11-11T09:45:00.000Z'),
                        undefined,
                        revertMock,
                    )
                }
            >
                Przeciągnij wizytę
            </button>
            <button
                type="button"
                onClick={() =>
                    onTimeSlotClick?.(new Date('2026-12-08T09:15:00.000Z'))
                }
            >
                Kliknij pustą godzinę
            </button>
            <button
                type="button"
                onClick={() =>
                    onDateSelect(
                        new Date('2026-12-08T09:15:00.000Z'),
                        new Date('2026-12-08T09:45:00.000Z'),
                    )
                }
            >
                Zaznacz zakres godzin
            </button>
        </div>
    ),
}));
jest.mock('@/components/calendar/AppointmentQuickModal', () => ({
    __esModule: true,
    default: ({
        open,
        onOpenFull,
    }: {
        open: boolean;
        onOpenFull: () => void;
    }) =>
        open ? (
            <div data-testid="quick-modal">
                <button type="button" onClick={onOpenFull}>
                    Edytuj wizytę
                </button>
            </div>
        ) : null,
}));
jest.mock('@/components/calendar/AppointmentDrawer', () => ({
    __esModule: true,
    default: ({
        open,
        mode,
        visualVariant,
        appointment,
        initialStartTime,
        initialEndTime,
        initialEmployeeId,
    }: {
        open: boolean;
        mode: string;
        visualVariant: string;
        appointment?: { id?: number } | null;
        initialStartTime?: Date;
        initialEndTime?: Date;
        initialEmployeeId?: number;
    }) =>
        open ? (
            <div
                data-testid="booking-drawer"
                data-mode={mode}
                data-variant={visualVariant}
                data-appointment={appointment?.id ?? ''}
                data-start={initialStartTime?.toISOString() ?? ''}
                data-end={initialEndTime?.toISOString() ?? ''}
                data-employee={initialEmployeeId ?? ''}
            />
        ) : null,
}));
jest.mock('@/components/calendar/TimeBlockModal', () => ({
    __esModule: true,
    default: () => null,
}));

const eventFixture: CalendarEvent = {
    id: 301,
    type: 'appointment',
    title: 'Strzyżenie',
    startTime: '2026-11-09T09:00:00.000Z',
    endTime: '2026-11-09T09:45:00.000Z',
    employeeId: 7,
    employeeName: 'Personel testowy',
    clientId: 55,
    clientName: 'Klient testowy',
    serviceId: 15,
    serviceName: 'Strzyżenie',
    status: 'confirmed',
};

const testData = {
    events: [eventFixture],
    employees: [{ id: 7, name: 'Personel testowy' }],
    dateRange: { start: '2026-11-09', end: '2026-11-10' },
};

beforeEach(() => {
    jest.clearAllMocks();
    conflictsMock.mockResolvedValue({ hasConflict: false, conflictingEvents: [] });
    rescheduleMock.mockResolvedValue({});
    jest.mocked(useCalendarMutations).mockReturnValue({
        checkConflicts: conflictsMock,
        rescheduleAppointment: { mutateAsync: rescheduleMock },
    } as unknown as ReturnType<typeof useCalendarMutations>);
    jest.mocked(useAuth).mockReturnValue({
        role: 'admin',
    } as ReturnType<typeof useAuth>);
    jest.mocked(useCalendar).mockReturnValue({
        data: testData,
        loading: false,
        error: null,
        refetch: jest.fn(),
    } as unknown as ReturnType<typeof useCalendar>);
});

describe('Calendar V18 DEV pilot', () => {
    it('enables active appointment drag in the V18 daily grid', () => {
        render(<V18CalendarPilot />);
        expect(
            screen.getByRole('heading', { name: 'Kalendarz' }),
        ).toBeInTheDocument();
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute(
            'data-readonly',
            'false',
        );
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute(
            'data-dragonly',
            'true',
        );
        expect(screen.getByText('Klient testowy')).toBeInTheDocument();
        expect(useCalendar).toHaveBeenCalledWith(
            expect.objectContaining({
                view: 'day',
            }),
        );
        const legacyLinks = screen.getAllByRole('link', {
            name: /Klasyczny kalendarz/,
        });
        expect(legacyLinks.length).toBeGreaterThan(0);
        legacyLinks.forEach((link) => {
            expect(link).toHaveAttribute('href', '/calendar');
        });
    });

    it('does not persist a drag before confirmation and preserves duration', async () => {
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Przeciągnij wizytę' }));
        expect(revertMock).toHaveBeenCalledTimes(1);
        expect(rescheduleMock).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: /Przełożyć wizytę/i })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Potwierdź przełożenie' }));
        await waitFor(() =>
            expect(rescheduleMock).toHaveBeenCalledWith({
                id: 301,
                startTime: '2026-11-11T09:00:00.000Z',
                employeeId: 7,
            }),
        );
        expect(conflictsMock).toHaveBeenCalledWith(
            7,
            '2026-11-11T09:00:00.000Z',
            '2026-11-11T09:45:00.000Z',
            301,
        );
    });

    it('does not save if operator cancels the dragged appointment', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Przeciągnij wizytę' }));
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
        expect(rescheduleMock).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog', { name: /Przełożyć wizytę/i })).not.toBeInTheDocument();
    });

    it.each([
        ['time_block', 'Termin jest zablokowany'],
        ['appointment', 'Termin koliduje z inną wizytą'],
    ])('blocks %s conflict without API reschedule mutation', async (type, message) => {
        conflictsMock.mockResolvedValue({
            hasConflict: true,
            conflictingEvents: [{ id: 17, type, title: 'Konflikt' }],
        });
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Przeciągnij wizytę' }));
        fireEvent.click(screen.getByRole('button', { name: 'Potwierdź przełożenie' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(message);
        expect(rescheduleMock).not.toHaveBeenCalled();
    });

    it('focuses on the calendar and hides redundant staff controls for one person', () => {
        render(<V18CalendarPilot />);
        expect(
            screen.queryByRole('heading', { name: 'Zespół' }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Klienci' })).toHaveAttribute(
            'href',
            '/studio-v18/customers',
        );
        expect(screen.getByRole('link', { name: 'Wizyty' })).toHaveAttribute(
            'href',
            '/appointments',
        );
        fireEvent.click(screen.getByRole('button', { name: 'Tydzień' }));
        expect(useCalendar).toHaveBeenLastCalledWith(
            expect.objectContaining({ view: 'week' }),
        );
        expect(
            screen.getByTestId('v18-mobile-week-agenda'),
        ).toBeInTheDocument();
    });

    it('preserves staff filtering if additional providers are ever configured', () => {
        jest.mocked(useCalendar).mockReturnValue({
            data: {
                ...testData,
                employees: [
                    { id: 7, name: 'Personel testowy' },
                    { id: 8, name: 'Druga osoba' },
                ],
            },
            loading: false,
            error: null,
            refetch: jest.fn(),
        } as unknown as ReturnType<typeof useCalendar>);
        render(<V18CalendarPilot />);
        fireEvent.click(
            screen.getByRole('button', { name: /Personel testowy/ }),
        );
        expect(useCalendar).toHaveBeenLastCalledWith(
            expect.objectContaining({ employeeIds: [7] }),
        );
    });

    it('reuses shared booking and appointment actions with the V18 visual variant', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Otwórz przykładową wizytę' }),
        );
        expect(screen.getByTestId('quick-modal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Edytuj wizytę' }));
        expect(screen.getByTestId('booking-drawer')).toHaveAttribute(
            'data-mode',
            'edit',
        );
        expect(screen.getByTestId('booking-drawer')).toHaveAttribute(
            'data-appointment',
            '301',
        );
        expect(screen.getByTestId('booking-drawer')).toHaveAttribute(
            'data-variant',
            'v18',
        );
    });

    it.each(['Dzień', 'Tydzień'])(
        'opens a prefilled booking form on one empty slot click in %s view',
        (calendarView) => {
            render(<V18CalendarPilot />);
            fireEvent.click(screen.getByRole('button', { name: calendarView }));
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Kliknij pustą godzinę',
                }),
            );
            const drawer = screen.getByTestId('booking-drawer');
            expect(drawer).toHaveAttribute('data-mode', 'create');
            expect(drawer).toHaveAttribute(
                'data-start',
                '2026-12-08T09:15:00.000Z',
            );
            expect(drawer).toHaveAttribute('data-end', '');
            expect(drawer).toHaveAttribute('data-employee', '7');
        },
    );

    it('still opens the appointment drawer for a selected time range', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Zaznacz zakres godzin' }),
        );
        const drawer = screen.getByTestId('booking-drawer');
        expect(drawer).toHaveAttribute('data-mode', 'create');
        expect(drawer).toHaveAttribute(
            'data-start',
            '2026-12-08T09:15:00.000Z',
        );
        expect(drawer).toHaveAttribute('data-end', '2026-12-08T09:45:00.000Z');
    });

    it('does not assume a stylist when several employees are visible', () => {
        jest.mocked(useCalendar).mockReturnValue({
            data: {
                ...testData,
                employees: [
                    { id: 7, name: 'Personel testowy' },
                    { id: 8, name: 'Inna osoba' },
                ],
            },
            loading: false,
            error: null,
            refetch: jest.fn(),
        } as unknown as ReturnType<typeof useCalendar>);
        render(<V18CalendarPilot />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Kliknij pustą godzinę' }),
        );
        expect(screen.getByTestId('booking-drawer')).toHaveAttribute(
            'data-employee',
            '',
        );
    });

    it('does not show stale KPI values after an API error', () => {
        jest.mocked(useCalendar).mockReturnValue({
            data: testData,
            loading: false,
            error: new Error('Unavailable'),
            refetch: jest.fn(),
        } as unknown as ReturnType<typeof useCalendar>);
        render(<V18CalendarPilot />);
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Nie udało się pobrać wizyt',
        );
        expect(screen.queryByTestId('shared-calendar')).not.toBeInTheDocument();
    });

    it('jumps directly to the selected calendar date without UTC drift', () => {
        render(<V18CalendarPilot />);
        fireEvent.change(screen.getByLabelText('Przejdź do daty'), {
            target: { value: '2026-12-24' },
        });
        expect(useCalendar).toHaveBeenLastCalledWith(
            expect.objectContaining({ date: '2026-12-24' }),
        );
    });

    it.each(['2026-03-29', '2026-10-25'])(
        'parses DST transition date %s at local noon',
        (value) => {
            const date = parseCalendarDate(value);
            expect(date).not.toBeNull();
            expect(date?.getHours()).toBe(12);
            expect(date?.getFullYear()).toBe(2026);
            expect(date?.getMonth() + 1).toBe(Number(value.slice(5, 7)));
            expect(date?.getDate()).toBe(Number(value.slice(8, 10)));
        },
    );

    it.each(['2026-02-30', '2026-13-01', '2026-11-09T12:00:00Z', ''])(
        'ignores invalid date picker input %s',
        (value) => {
            expect(parseCalendarDate(value)).toBeNull();
        },
    );

    it('is unavailable on production and unauthorized hosts', async () => {
        const ctx = (host: string) =>
            ({
                req: { headers: { host } },
            }) as Parameters<typeof getServerSideProps>[0];
        const before = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
        const beforeNode = process.env.NODE_ENV;
        try {
            process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'development';
            expect(
                await getServerSideProps(ctx('dev-panel.salon-bw.pl')),
            ).toEqual({ props: {} });
            expect(await getServerSideProps(ctx('unknown.example'))).toEqual({
                notFound: true,
            });
            process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'production';
            // Next's local NODE_ENV may remain 'test'; the route still must reject an unauthorized host.
            expect(await getServerSideProps(ctx('unknown.example'))).toEqual({
                notFound: true,
            });
        } finally {
            process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = before;
            process.env.NODE_ENV = beforeNode;
        }
    });
});
