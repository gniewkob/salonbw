import { fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarEvent } from '@/types';
import {
    V18CalendarPilot,
    getServerSideProps,
    parseCalendarDate,
} from '@/pages/studio-v18/calendar';

jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useCalendar', () => ({ useCalendar: jest.fn() }));
jest.mock('@/components/calendar/CalendarView', () => ({
    __esModule: true,
    default: ({
        onEventClick,
        readOnly,
    }: {
        onEventClick: (event: CalendarEvent) => void;
        readOnly?: boolean;
    }) => (
        <div data-testid="shared-calendar" data-readonly={String(readOnly)}>
            <button type="button" onClick={() => onEventClick(eventFixture)}>
                Otwórz przykładową wizytę
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
    }: {
        open: boolean;
        mode: string;
        visualVariant: string;
        appointment?: { id?: number } | null;
    }) =>
        open ? (
            <div
                data-testid="booking-drawer"
                data-mode={mode}
                data-variant={visualVariant}
                data-appointment={appointment?.id ?? ''}
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
    it('uses the live calendar hook and keeps drag/resize disabled in the pilot', () => {
        render(<V18CalendarPilot />);
        expect(
            screen.getByRole('heading', { name: 'Plan dnia, bez chaosu.' }),
        ).toBeInTheDocument();
        expect(screen.getByTestId('shared-calendar')).toHaveAttribute(
            'data-readonly',
            'true',
        );
        expect(screen.getByText('Klient testowy')).toBeInTheDocument();
        expect(useCalendar).toHaveBeenCalledWith(
            expect.objectContaining({
                view: 'day',
            }),
        );
        expect(
            screen.getByRole('link', { name: /Klasyczny kalendarz/ }),
        ).toHaveAttribute('href', '/calendar');
    });

    it('does not show a redundant staff selector for the single salon operator', () => {
        render(<V18CalendarPilot />);
        fireEvent.click(screen.getByRole('button', { name: 'Tydzień' }));
        expect(useCalendar).toHaveBeenLastCalledWith(
            expect.objectContaining({ view: 'week' }),
        );
        expect(
            screen.getByTestId('v18-mobile-week-agenda'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Zespół' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Blokady czasu')).toBeInTheDocument();
    });

    it('preserves staff filtering if the salon adds another employee', () => {
        jest.mocked(useCalendar).mockReturnValue({
            data: {
                ...testData,
                employees: [
                    ...testData.employees,
                    { id: 8, name: 'Drugi pracownik' },
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
