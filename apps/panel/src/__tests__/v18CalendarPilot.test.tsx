import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';
import { useBookableEmployees } from '@/hooks/useEmployees';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CalendarEvent } from '@/types';
import {
    V18CalendarPilot,
    getServerSideProps,
    parseCalendarDate,
} from '@/pages/studio-v18/calendar';

jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useEmployees', () => ({ useBookableEmployees: jest.fn() }));
jest.mock('@/hooks/useIsMobile', () => ({ useIsMobile: jest.fn() }));
jest.mock('@/hooks/useCalendar', () => ({
    useCalendar: jest.fn(),
    useCalendarMutations: jest.fn(),
}));
jest.mock('@/components/calendar/CalendarView', () => ({
    __esModule: true,
    default: ({
        onEventClick,
        onEventDrop,
        onTimeSlotClick,
        onDateSelect,
        readOnly = false,
        allowPendingAdminDrag = false,
        sideBySideOverlaps = false,
        currentView,
        touchDragLongPressDelay,
    }: {
        onEventClick: (event: CalendarEvent) => void;
        onEventDrop?: (
            id: number,
            start: Date,
            end: Date,
            employeeId?: number,
            revert?: () => void,
        ) => Promise<void> | void;
        onTimeSlotClick?: (start: Date) => void;
        onDateSelect: (start: Date, end: Date) => void;
        readOnly?: boolean;
        allowPendingAdminDrag?: boolean;
        sideBySideOverlaps?: boolean;
        currentView?: string;
        touchDragLongPressDelay?: number;
    }) => (
        <div
            data-testid="shared-calendar"
            data-readonly={String(readOnly)}
            data-admin-pending-drag={String(allowPendingAdminDrag)}
            data-side-by-side={String(sideBySideOverlaps)}
            data-current-view={currentView}
            data-touch-drag-delay={String(touchDragLongPressDelay)}
        >
            <button
                type="button"
                onClick={() =>
                    void onEventDrop?.(
                        eventFixture.id,
                        new Date('2026-12-08T10:00:00.000Z'),
                        new Date('2026-12-08T10:45:00.000Z'),
                        eventFixture.employeeId,
                        jest.fn(),
                    )
                }
            >
                Przeciągnij na zajęty termin
            </button>
            <button
                type="button"
                onClick={() =>
                    void onEventDrop?.(
                        eventFixture.id,
                        new Date('2026-12-08T20:00:00.000Z'),
                        new Date('2026-12-08T20:45:00.000Z'),
                        eventFixture.employeeId,
                        jest.fn(),
                    )
                }
            >
                Przeciągnij po zamknięciu
            </button>
            <button type="button" onClick={() => onEventClick(eventFixture)}>
                Otwórz przykładową wizytę
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
    default: ({
        open,
        existingBlock,
        initialStartTime,
        initialEndTime,
        initialEmployeeId,
        employees,
    }: {
        open: boolean;
        existingBlock?: { id: number } | null;
        initialStartTime?: Date;
        initialEndTime?: Date;
        initialEmployeeId?: number;
        employees: Array<{ id: number; name: string }>;
    }) =>
        open ? (
            <div
                data-testid="time-block-modal"
                data-mode={existingBlock ? 'edit' : 'create'}
                data-block-id={existingBlock?.id ?? ''}
                data-start={initialStartTime?.toISOString() ?? ''}
                data-end={initialEndTime?.toISOString() ?? ''}
                data-employee={initialEmployeeId ?? ''}
                data-employee-count={employees.length}
            />
        ) : null,
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


const openingHoursFixture = {
    source: 'timetables' as const,
    hours: {
        sun: [{ open: '09:00', close: '18:00' }],
        mon: [{ open: '09:00', close: '18:00' }],
        tue: [{ open: '09:00', close: '18:00' }],
        wed: [{ open: '09:00', close: '18:00' }],
        thu: [{ open: '09:00', close: '18:00' }],
        fri: [{ open: '09:00', close: '18:00' }],
        sat: [{ open: '09:00', close: '18:00' }],
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useIsMobile).mockReturnValue(false);
    jest.mocked(useBookableEmployees).mockReturnValue({
        data: testData.employees,
    } as ReturnType<typeof useBookableEmployees>);
    jest.mocked(useAuth).mockReturnValue({
        role: 'admin',
        // The real calendar fetches weekly hours before approving a drag.
        // These test dates are inside confirmed Warsaw working hours.
        apiFetch: jest.fn().mockResolvedValue(openingHoursFixture),
    } as unknown as ReturnType<typeof useAuth>);
    jest.mocked(useCalendarMutations).mockReturnValue({
        rescheduleAppointment: { mutateAsync: jest.fn() },
        checkConflicts: jest.fn(),
    } as unknown as ReturnType<typeof useCalendarMutations>);
    jest.mocked(useCalendar).mockReturnValue({
        data: testData,
        loading: false,
        error: null,
        refetch: jest.fn(),
    } as unknown as ReturnType<typeof useCalendar>);
});

describe('Calendar V18 DEV pilot', () => {
    it('hides month mode on mobile and returns to day when the viewport narrows', async () => {
        const { rerender } = render(<V18CalendarPilot />);
        expect(screen.getByRole('button', { name: 'Miesiąc' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Miesiąc' }));
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute('data-current-view', 'month');

        jest.mocked(useIsMobile).mockReturnValue(true);
        rerender(<V18CalendarPilot />);
        await waitFor(() =>
            expect(screen.getByTestId('shared-calendar')).toHaveAttribute('data-current-view', 'day'),
        );
        expect(screen.queryByRole('button', { name: 'Miesiąc' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tydzień' })).toBeVisible();
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute('data-touch-drag-delay', '350');
    });

    it('uses the live calendar hook and enables guarded drag in V18', () => {
        render(<V18CalendarPilot />);
        expect(
            screen.getByRole('heading', { name: 'Kalendarz' }),
        ).toBeInTheDocument();
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute(
            'data-readonly',
            'false',
        );
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute(
            'data-side-by-side',
            'true',
        );
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute(
            'data-admin-pending-drag',
            'true',
        );
        expect(screen.getByText('Klient testowy')).toBeInTheDocument();
        expect(useCalendar).toHaveBeenCalledWith(
            expect.objectContaining({
                view: 'day',
            }),
        );
        // The classic calendar remains a fallback, but Studio V18 must
        // not advertise two differently labeled links to the same page.
        expect(screen.getByRole('link', {
            name: 'Klasyczny kalendarz',
        })).toHaveAttribute('href', '/calendar');
        expect(screen.queryByRole('link', {
            name: 'Pełna obsługa kalendarza',
        })).not.toBeInTheDocument();
    });

    it('requires explicit admin confirmation before overlapping drag writes', async () => {
        const checkConflicts = jest.fn().mockResolvedValue({
            hasConflict: true,
            conflictingEvents: [{ ...eventFixture, id: 302 }],
        });
        const mutateAsync = jest.fn().mockResolvedValue({});
        jest.mocked(useCalendarMutations).mockReturnValue({
            rescheduleAppointment: { mutateAsync },
            checkConflicts,
        } as unknown as ReturnType<typeof useCalendarMutations>);

        render(<V18CalendarPilot />);
        await screen.findByText(/Godziny poza tygodniowym grafikiem są zacienione/);
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Przeciągnij na zajęty termin',
            }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Potwierdź nałożenie wizyt',
        });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveTextContent('8 grudnia 2026');
        const confirm = await screen.findByRole('button', {
            name: 'Przenieś mimo konfliktu',
        });
        expect(mutateAsync).not.toHaveBeenCalled();
        fireEvent.click(confirm);
        await waitFor(() =>
            expect(mutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 301,
                    employeeId: 7,
                    force: true,
                    confirmImmediately: true,
                    startTime: '2026-12-08T10:00:00.000Z',
                    endTime: '2026-12-08T10:45:00.000Z',
                }),
            ),
        );
        expect(checkConflicts).toHaveBeenCalledTimes(2);
    });

    it('keeps admin manual calendar drag out of client-pending proposal status', async () => {
        const mutateAsync = jest.fn().mockResolvedValue({});
        jest.mocked(useCalendarMutations).mockReturnValue({
            rescheduleAppointment: { mutateAsync },
            checkConflicts: jest.fn().mockResolvedValue({
                hasConflict: false,
                conflictingEvents: [],
            }),
        } as unknown as ReturnType<typeof useCalendarMutations>);

        render(<V18CalendarPilot />);
        await screen.findByText(/Godziny poza tygodniowym grafikiem są zacienione/);
        fireEvent.click(
            screen.getByRole('button', { name: 'Przeciągnij na zajęty termin' }),
        );
        await waitFor(() =>
            expect(mutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 301,
                    confirmImmediately: true,
                }),
            ),
        );
    });

    it('does not silently grant manual confirmation when a non-admin drags', async () => {
        jest.mocked(useAuth).mockReturnValue({
            role: 'employee',
            apiFetch: jest.fn().mockResolvedValue(openingHoursFixture),
        } as unknown as ReturnType<typeof useAuth>);
        const mutateAsync = jest.fn().mockResolvedValue({});
        jest.mocked(useCalendarMutations).mockReturnValue({
            rescheduleAppointment: { mutateAsync },
            checkConflicts: jest.fn().mockResolvedValue({
                hasConflict: false,
                conflictingEvents: [],
            }),
        } as unknown as ReturnType<typeof useCalendarMutations>);
        render(<V18CalendarPilot />);
        await screen.findByText(/Godziny poza tygodniowym grafikiem są zacienione/);
        fireEvent.click(
            screen.getByRole('button', { name: 'Przeciągnij na zajęty termin' }),
        );
        await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
        expect(mutateAsync.mock.calls[0]?.[0]).not.toHaveProperty(
            'confirmImmediately',
        );
    });

    it('requires a separate admin acknowledgement to move a visit after closing', async () => {
        const mutateAsync = jest.fn().mockResolvedValue({});
        const checkConflicts = jest.fn().mockResolvedValue({
            hasConflict: false,
            conflictingEvents: [],
        });
        jest.mocked(useCalendarMutations).mockReturnValue({
            rescheduleAppointment: { mutateAsync },
            checkConflicts,
        } as unknown as ReturnType<typeof useCalendarMutations>);

        render(<V18CalendarPilot />);
        await screen.findByText(/Godziny poza tygodniowym grafikiem są zacienione/);
        fireEvent.click(screen.getByRole('button', {
            name: 'Przeciągnij po zamknięciu',
        }));
        const dialog = await screen.findByRole('dialog', {
            name: 'Wizyta poza godzinami pracy',
        });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveTextContent('8 grudnia 2026');
        expect(dialog).toHaveTextContent('21:00');
        expect(dialog).toHaveTextContent(/Termin poza godzinami pracy salonu/);
        const confirm = await screen.findByRole('button', {
            name: 'Przenieś poza godzinami pracy',
        });
        expect(mutateAsync).not.toHaveBeenCalled();
        // Cancelling must keep the persisted visit intact.
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
        expect(screen.queryByRole('dialog', {
            name: 'Wizyta poza godzinami pracy',
        })).not.toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {
            name: 'Przeciągnij po zamknięciu',
        }));
        const confirmAgain = await screen.findByRole('button', {
            name: 'Przenieś poza godzinami pracy',
        });
        fireEvent.click(confirmAgain);
        await waitFor(() =>
            expect(mutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 301,
                    startTime: '2026-12-08T20:00:00.000Z',
                    endTime: '2026-12-08T20:45:00.000Z',
                    confirmImmediately: true,
                }),
            ),
        );
        // First drag, cancelled approval, second drag and final confirmation:
        // 1 + 1 + 1 conflict checks. Cancelling never sends a write.
        expect(checkConflicts).toHaveBeenCalledTimes(3);
    });

    it('does not let employees bypass opening hours by dragging', async () => {
        jest.mocked(useAuth).mockReturnValue({
            role: 'employee',
            apiFetch: jest.fn().mockResolvedValue(openingHoursFixture),
        } as unknown as ReturnType<typeof useAuth>);
        const mutateAsync = jest.fn();
        jest.mocked(useCalendarMutations).mockReturnValue({
            rescheduleAppointment: { mutateAsync },
            checkConflicts: jest.fn().mockResolvedValue({
                hasConflict: false, conflictingEvents: [],
            }),
        } as unknown as ReturnType<typeof useCalendarMutations>);

        render(<V18CalendarPilot />);
        await screen.findByText(/Godziny poza tygodniowym grafikiem są zacienione/);
        fireEvent.click(screen.getByRole('button', {
            name: 'Przeciągnij po zamknięciu',
        }));
        const notice = await screen.findByRole('alert');
        expect(notice).toHaveTextContent(/Termin poza godzinami pracy salonu/);
        expect(screen.queryByRole('dialog', {
            name: 'Wizyta poza godzinami pracy',
        })).not.toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {
            name: 'Zamknij komunikat',
        }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('never offers an overlap override for a hard time block', async () => {
        const mutateAsync = jest.fn();
        jest.mocked(useCalendarMutations).mockReturnValue({
            rescheduleAppointment: { mutateAsync },
            checkConflicts: jest.fn().mockResolvedValue({
                hasConflict: true,
                conflictingEvents: [{ ...eventFixture, type: 'time_block' }],
            }),
        } as unknown as ReturnType<typeof useCalendarMutations>);

        render(<V18CalendarPilot />);
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Przeciągnij na zajęty termin',
            }),
        );
        expect(
            await screen.findByText('Ten termin jest zablokowany w grafiku.'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Przenieś mimo konfliktu' }),
        ).not.toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
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
        jest.mocked(useBookableEmployees).mockReturnValue({
            data: [
                { id: 7, name: 'Personel testowy' },
                { id: 8, name: 'Druga osoba' },
            ],
        } as ReturnType<typeof useBookableEmployees>);
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
        const { rerender } = render(<V18CalendarPilot />);
        fireEvent.click(
            screen.getByRole('button', { name: /Personel testowy/ }),
        );
        expect(useCalendar).toHaveBeenLastCalledWith(
            expect.objectContaining({ employeeIds: [7] }),
        );
        jest.mocked(useCalendar).mockReturnValue({
            data: testData,
            loading: false,
            error: null,
            refetch: jest.fn(),
        } as unknown as ReturnType<typeof useCalendar>);
        // A filtered calendar response has one employee, but the selector must remain available.
        rerender(<V18CalendarPilot />);
        expect(
            screen.getByRole('button', { name: /Druga osoba/ }),
        ).toBeInTheDocument();
    });

    it('allows retry and clearing an active filter after the roster fails', () => {
        const retry = jest.fn();
        jest.mocked(useBookableEmployees).mockReturnValue({
            data: [
                { id: 7, name: 'Personel testowy' },
                { id: 8, name: 'Druga osoba' },
            ],
            error: null,
            refetch: retry,
        } as ReturnType<typeof useBookableEmployees>);
        const { rerender } = render(<V18CalendarPilot />);
        fireEvent.click(
            screen.getByRole('button', { name: /Personel testowy/ }),
        );
        jest.mocked(useBookableEmployees).mockReturnValue({
            data: null,
            error: new Error('failure'),
            refetch: retry,
        } as ReturnType<typeof useBookableEmployees>);
        rerender(<V18CalendarPilot />);
        expect(
            screen.getByText('Nie udało się pobrać listy wykonawców.'),
        ).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole('button', { name: 'Ponów pobieranie zespołu' }),
        );
        expect(retry).toHaveBeenCalled();
        fireEvent.click(
            screen.getByRole('button', { name: /Wszyscy pracownicy/ }),
        );
        expect(useCalendar).toHaveBeenLastCalledWith(
            expect.objectContaining({ employeeIds: undefined }),
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
            expect(screen.getByRole('dialog', {
                name: 'Co chcesz dodać?',
            })).toBeVisible();
            expect(screen.queryByTestId('booking-drawer')).not.toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: 'Wizyta' }));
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
        fireEvent.click(screen.getByRole('button', { name: 'Wizyta' }));
        const drawer = screen.getByTestId('booking-drawer');
        expect(drawer).toHaveAttribute('data-mode', 'create');
        expect(drawer).toHaveAttribute(
            'data-start',
            '2026-12-08T09:15:00.000Z',
        );
        expect(drawer).toHaveAttribute('data-end', '2026-12-08T09:45:00.000Z');
    });

    it('opens the existing time-block creation modal from a dedicated toolbar action', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Blokuj czas' }));
        const modal = screen.getByTestId('time-block-modal');
        expect(modal).toHaveAttribute('data-mode', 'create');
        expect(modal).toHaveAttribute('data-employee', '7');
        expect(modal).toHaveAttribute('data-employee-count', '1');
        expect(new Date(modal.getAttribute('data-end')!).getTime()).toBe(
            new Date(modal.getAttribute('data-start')!).getTime() + 60 * 60 * 1000,
        );
        expect(screen.queryByTestId('booking-drawer')).not.toBeInTheDocument();
    });

    it('offers a block after clicking an empty slot and preserves the clicked time', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Kliknij pustą godzinę' }));
        expect(screen.getByRole('dialog', { name: 'Co chcesz dodać?' })).toBeVisible();
        expect(screen.queryByTestId('time-block-modal')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Blokada' }));
        const modal = screen.getByTestId('time-block-modal');
        expect(modal).toHaveAttribute('data-mode', 'create');
        expect(modal).toHaveAttribute('data-start', '2026-12-08T09:15:00.000Z');
        expect(modal).toHaveAttribute('data-end', '');
        expect(modal).toHaveAttribute('data-employee', '7');
        expect(screen.queryByRole('dialog', { name: 'Co chcesz dodać?' })).not.toBeInTheDocument();
    });

    it('prefills both dates when creating a block from a selected interval', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Zaznacz zakres godzin' }));
        fireEvent.click(screen.getByRole('button', { name: 'Blokada' }));
        const modal = screen.getByTestId('time-block-modal');
        expect(modal).toHaveAttribute('data-mode', 'create');
        expect(modal).toHaveAttribute('data-start', '2026-12-08T09:15:00.000Z');
        expect(modal).toHaveAttribute('data-end', '2026-12-08T09:45:00.000Z');
    });

    it('closes a slot choice without creating a visit or block', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Kliknij pustą godzinę' }));
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
        expect(screen.queryByRole('dialog', { name: 'Co chcesz dodać?' })).not.toBeInTheDocument();
        expect(screen.queryByTestId('booking-drawer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('time-block-modal')).not.toBeInTheDocument();
    });

    it('keeps block creation available with an employee selection when several staff exist', () => {
        jest.mocked(useBookableEmployees).mockReturnValue({
            data: [
                { id: 7, name: 'Personel testowy' },
                { id: 8, name: 'Druga osoba' },
            ],
        } as ReturnType<typeof useBookableEmployees>);
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Blokuj czas' }));
        expect(screen.getByTestId('time-block-modal')).toHaveAttribute('data-employee-count', '2');
        expect(screen.getByTestId('time-block-modal')).toHaveAttribute('data-employee', '');
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
        fireEvent.click(screen.getByRole('button', { name: 'Wizyta' }));
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
