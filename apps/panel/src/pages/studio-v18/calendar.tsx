import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import DatePicker from 'react-datepicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    addDays,
    addMonths,
    addWeeks,
    format,
    isSameMonth,
    isSameWeek,
    subDays,
    subMonths,
    subWeeks,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    CalendarDaysIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    PlusIcon,
    Squares2X2Icon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';
import { useDateInputLocale } from '@/hooks/useDateInputLocale';
import {
    computeSlotBounds,
    isDayClosed,
    toBusinessHours,
    type OpeningHoursResponse,
    type WeeklyHours,
} from '@/utils/openingHoursCalendar';
import { useAppointmentDrawer } from '@/hooks/calendar/useAppointmentDrawer';
import CalendarView from '@/components/calendar/CalendarView';
import V18MobileWeekAgenda from '@/components/v18/V18MobileWeekAgenda';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';
import AppointmentQuickModal from '@/components/calendar/AppointmentQuickModal';
import TimeBlockModal from '@/components/calendar/TimeBlockModal';
import { getFirstQueryValue, toDateParam } from '@/utils/calendarQueryState';
import type {
    Appointment,
    CalendarEvent,
    CalendarView as CalendarViewType,
    TimeBlock,
} from '@/types';
import foundation from '@/styles/V18Foundation.module.css';
import styles from '@/styles/V18Calendar.module.css';
import dateInputStyles from '@/styles/V18DateInput.module.css';

type PilotView = Extract<CalendarViewType, 'day' | 'week' | 'month'>;

interface PendingCalendarMove {
    id: number;
    employeeId: number;
    startTime: string;
    endTime: string;
    clientName: string;
    appointmentOverlap: boolean;
    revert?: () => void;
}

function formatWarsawDateTime(value: string): string {
    return new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Warsaw',
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

const views: { id: PilotView; title: string }[] = [
    { id: 'day', title: 'Dzień' },
    { id: 'week', title: 'Tydzień' },
    { id: 'month', title: 'Miesiąc' },
];

/**
 * Parse a date-only value in the browser's local timezone at noon.
 * Avoid UTC midnight: it can shift the selected day across DST/timezones.
 */
export function parseCalendarDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) || toDateParam(date) !== value
        ? null
        : date;
}

function moveDate(date: Date, view: PilotView, direction: -1 | 1): Date {
    if (view === 'month')
        return direction > 0 ? addMonths(date, 1) : subMonths(date, 1);
    if (view === 'week')
        return direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1);
    return direction > 0 ? addDays(date, 1) : subDays(date, 1);
}

/**
 * V18 reuses the existing transactional booking API. Dragging a visit changes
 * no server data until the operator confirms the destination and a fresh
 * conflict classification passes. Time blocks are never overridable.
 */
export function V18CalendarPilot() {
    const { role, apiFetch } = useAuth();
    const { locale } = useDateInputLocale();
    const router = useRouter();
    // The router can be not yet hydrated; older calendar tests also provide a
    // partial Next router. Treat an absent query as empty until isReady.
    const routeQuery = router.query ?? {};
    const dashboardHref =
        role === 'admin' ? '/studio-v18' : getPostLoginRoute(role);
    const [date, setDate] = useState(() => new Date());
    const [view, setView] = useState<PilotView>('day');
    const [routeReady, setRouteReady] = useState(false);
    const [employeeIds, setEmployeeIds] = useState<number[]>([]);
    const { checkConflicts, rescheduleAppointment } = useCalendarMutations();
    const [pendingMove, setPendingMove] = useState<PendingCalendarMove | null>(
        null,
    );
    const moveInProgressRef = useRef(false);
    const [savingMove, setSavingMove] = useState(false);
    const [moveError, setMoveError] = useState<string | null>(null);
    const [openingHours, setOpeningHours] = useState<WeeklyHours | null>(null);
    const [openingHoursSource, setOpeningHoursSource] =
        useState<OpeningHoursResponse['source']>(undefined);
    const [openingHoursState, setOpeningHoursState] = useState<
        'loading' | 'ready' | 'unavailable'
    >('loading');

    // Restore the operator's context from the calendar URL after coming back
    // from a customer card. Do not parse on the server: this pilot's state is
    // hydrated by Next's client router and date-only values use local noon.
    useEffect(() => {
        if (!router.isReady || routeReady) return;

        const restoredDate = parseCalendarDate(
            getFirstQueryValue(routeQuery.date) ?? '',
        );
        const restoredView = getFirstQueryValue(routeQuery.view);
        if (restoredDate) setDate(restoredDate);
        if (
            restoredView === 'day' ||
            restoredView === 'week' ||
            restoredView === 'month'
        ) {
            setView(restoredView);
        }
        setRouteReady(true);
    }, [router.isReady, routeQuery.date, routeQuery.view, routeReady]);

    // Shallow replace preserves a single calendar history entry (Back from the
    // customer card returns to this date/view) without rerunning SSR or
    // polluting history for every day/week click. Retain unrelated parameters.
    useEffect(() => {
        if (!routeReady || !router.isReady) return;
        const dateParam = toDateParam(date);
        if (
            getFirstQueryValue(routeQuery.date) === dateParam &&
            getFirstQueryValue(routeQuery.view) === view
        ) {
            return;
        }

        void router.replace(
            {
                pathname: router.pathname,
                query: { ...routeQuery, date: dateParam, view },
            },
            undefined,
            { shallow: true, scroll: false },
        );
    }, [date, view, routeReady, router]);
    const [block, setBlock] = useState<TimeBlock | null>(null);
    const {
        drawer,
        quickModal,
        openForCreate,
        close,
        openQuickModal,
        closeQuickModal,
        promoteQuickToEdit,
    } = useAppointmentDrawer();
    const { data, loading, error, refetch } = useCalendar({
        date: toDateParam(date),
        view,
        employeeIds: employeeIds.length ? employeeIds : undefined,
    });

    // FullCalendar may emit both select and dateClick for one short gesture.
    // Keep a single appointment drawer; no booking is persisted until Save.
    const lastSlotGesture = useRef<{
        start: number;
        timestamp: number;
    } | null>(null);
    const openForCalendarSlot = (
        start: Date,
        end?: Date,
        employeeId?: number,
    ) => {
        if (!Number.isFinite(start.getTime())) return;
        const timestamp = Date.now();
        const previous = lastSlotGesture.current;
        if (
            previous?.start === start.getTime() &&
            timestamp - previous.timestamp < 500
        ) {
            return;
        }
        lastSlotGesture.current = { start: start.getTime(), timestamp };

        // Only preselect a stylist if the operator selected precisely one,
        // or the API exposes exactly one available employee in this view.
        const unambiguousEmployeeId =
            employeeIds.length === 1
                ? employeeIds[0]
                : employeeIds.length === 0 && data?.employees.length === 1
                  ? data.employees[0].id
                  : undefined;
        openForCreate({
            startTime: start,
            endTime: end,
            employeeId: employeeId ?? unambiguousEmployeeId,
        });
    };

    // Reuse the same read-only weekly opening-hours endpoint and calendar
    // shading as the classic view. This is salon-level information, not a
    // promise that a particular employee/service is available at that time:
    // date-specific exceptions, breaks and bookings are validated by API.
    useEffect(() => {
        if (typeof apiFetch !== 'function') {
            setOpeningHoursState('unavailable');
            return;
        }
        let cancelled = false;
        void apiFetch<OpeningHoursResponse>('/calendar/opening-hours')
            .then((payload) => {
                if (cancelled) return;
                if (!payload?.hours || typeof payload.hours !== 'object') {
                    setOpeningHoursState('unavailable');
                    return;
                }
                setOpeningHours(payload.hours);
                setOpeningHoursSource(payload.source);
                setOpeningHoursState('ready');
            })
            .catch(() => {
                if (!cancelled) setOpeningHoursState('unavailable');
            });
        return () => {
            cancelled = true;
        };
    }, [apiFetch]);

    const calendarHours = useMemo(() => {
        if (!openingHours) return null;
        const bounds = computeSlotBounds(openingHours);
        return {
            ...bounds,
            businessHours: toBusinessHours(openingHours),
        };
    }, [openingHours]);

    const weeklyClosedDay =
        view === 'day' &&
        openingHours !== null &&
        isDayClosed(openingHours, date);

    const handleDatePickerChange = (selected: Date | null) => {
        if (!selected) return;
        const nextDate = parseCalendarDate(toDateParam(selected));
        if (nextDate) setDate(nextDate);
    };

    const appointmentsById = useMemo(() => {
        const map = new Map<number, Appointment>();
        for (const event of data?.events ?? []) {
            if (event.type !== 'appointment') continue;
            map.set(event.id, {
                id: event.id,
                startTime: event.startTime,
                endTime: event.endTime,
                status: event.status as Appointment['status'],
                paymentStatus: event.paymentStatus,
                paymentMethod: event.paymentMethod,
                paidAmount: event.paidAmount,
                clientComment: event.clientComment,
                staffRecommendations: event.staffRecommendations,
                onlineAddonsSummary: event.onlineAddonsSummary,
                onlineTotalDurationMinutes: event.onlineTotalDurationMinutes,
                onlineDurationNeedsVerification:
                    event.onlineDurationNeedsVerification,
                extraServices: event.extraServices,
                client: event.clientId
                    ? { id: event.clientId, name: event.clientName ?? 'Klient' }
                    : undefined,
                service: event.serviceId
                    ? {
                          id: event.serviceId,
                          name: event.serviceName ?? event.title,
                          duration: 0,
                          price: 0,
                          priceType: 'fixed',
                          isActive: true,
                          onlineBooking: false,
                          sortOrder: 0,
                      }
                    : undefined,
                employee:
                    event.employeeId > 0
                        ? { id: event.employeeId, name: event.employeeName }
                        : undefined,
            });
        }
        return map;
    }, [data?.events]);

    const visibleAppointments = useMemo(
        () =>
            (data?.events ?? [])
                .filter((event) => event.type === 'appointment')
                .sort((a, b) => a.startTime.localeCompare(b.startTime)),
        [data?.events],
    );
    const counts = useMemo(
        () => ({
            total: visibleAppointments.length,
            confirmed: visibleAppointments.filter(
                (event) => event.status === 'confirmed',
            ).length,
            pending: visibleAppointments.filter(
                (event) =>
                    event.status === 'online_pending' ||
                    event.status === 'rescheduled_pending',
            ).length,
        }),
        [visibleAppointments],
    );

    const handleEventClick = (event: CalendarEvent) => {
        if (event.type === 'time_block') {
            setBlock({
                id: event.id,
                employeeId: event.employeeId,
                employeeName: event.employeeName,
                startTime: event.startTime,
                endTime: event.endTime,
                type: event.blockType ?? 'other',
                title: event.title,
                allDay: event.allDay ?? false,
            });
            return;
        }
        openQuickModal(event, appointmentsById.get(event.id) ?? null);
    };

    const handleAppointmentDrop = async (
        id: number,
        newStart: Date,
        newEnd: Date,
        requestedEmployeeId?: number,
        revert?: () => void,
    ): Promise<void> => {
        const event = (data?.events ?? []).find(
            (item) => item.type === 'appointment' && item.id === id,
        );

        if (moveInProgressRef.current || !event) {
            revert?.();
            return;
        }
        if (
            !['scheduled', 'confirmed'].includes(event.status ?? '') ||
            !Number.isFinite(newStart.getTime()) ||
            !Number.isFinite(newEnd.getTime()) ||
            newStart.getTime() < Date.now() ||
            newEnd.getTime() <= newStart.getTime()
        ) {
            revert?.();
            setMoveError('Wybierz przyszły, prawidłowy termin aktywnej wizyty.');
            return;
        }

        const employeeId = requestedEmployeeId ?? event.employeeId;
        if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
            revert?.();
            setMoveError('Brak prawidłowego pracownika dla tej wizyty.');
            return;
        }

        moveInProgressRef.current = true;
        setMoveError(null);
        try {
            const result = await checkConflicts(
                employeeId,
                newStart.toISOString(),
                newEnd.toISOString(),
                id,
            );

            const conflicting = result.conflictingEvents;
            if (
                result.hasConflict &&
                (!Array.isArray(conflicting) ||
                    conflicting.length === 0 ||
                    conflicting.some((item) => item.type !== 'appointment'))
            ) {
                revert?.();
                setMoveError(
                    Array.isArray(conflicting) &&
                        conflicting.some((item) => item.type === 'time_block')
                        ? 'Termin obejmuje blokadę czasu. Zmień termin lub usuń blokadę osobno.'
                        : 'Nie można zweryfikować rodzaju konfliktu. Odśwież kalendarz.',
                );
                moveInProgressRef.current = false;
                return;
            }
            if (result.hasConflict && role !== 'admin') {
                revert?.();
                setMoveError(
                    'Termin koliduje z inną wizytą. Tylko administrator może zatwierdzić nakładanie wizyt.',
                );
                moveInProgressRef.current = false;
                return;
            }
            setPendingMove({
                id,
                employeeId,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString(),
                clientName: event.clientName ?? 'Klient',
                appointmentOverlap: result.hasConflict,
                revert,
            });
        } catch {
            revert?.();
            setMoveError(
                'Nie udało się sprawdzić terminu. Wizyta nie została przełożona.',
            );
            moveInProgressRef.current = false;
        }
    };

    const cancelPendingMove = () => {
        if (savingMove) return;
        pendingMove?.revert?.();
        setPendingMove(null);
        moveInProgressRef.current = false;
    };

    const confirmPendingMove = async () => {
        if (!pendingMove || savingMove) return;
        setSavingMove(true);
        try {
            // Refresh on the final click. A newly created hard block is never
            // bypassed; the backend also verifies this under a database lock.
            const conflicts = await checkConflicts(
                pendingMove.employeeId,
                pendingMove.startTime,
                pendingMove.endTime,
                pendingMove.id,
            );
            if (
                conflicts.hasConflict &&
                (!Array.isArray(conflicts.conflictingEvents) ||
                    conflicts.conflictingEvents.length === 0 ||
                    conflicts.conflictingEvents.some(
                        (item) => item.type !== 'appointment',
                    ))
            ) {
                throw new Error('blocked');
            }
            if (
                conflicts.hasConflict &&
                (role !== 'admin' || !pendingMove.appointmentOverlap)
            ) {
                throw new Error('new-overlap');
            }
            await rescheduleAppointment.mutateAsync({
                id: pendingMove.id,
                startTime: pendingMove.startTime,
                endTime: pendingMove.endTime,
                employeeId: pendingMove.employeeId,
                // Only an admin who acknowledged a verified appointment-only
                // conflict can send force. Never force hard time blocks.
                ...(conflicts.hasConflict ? { force: true } : {}),
            });
            setPendingMove(null);
            setMoveError(null);
            void refetch();
        } catch {
            pendingMove.revert?.();
            setPendingMove(null);
            setMoveError(
                'Przełożenie nie powiodło się lub termin uległ zmianie. Wybierz go ponownie.',
            );
            void refetch();
        } finally {
            setSavingMove(false);
            moveInProgressRef.current = false;
        }
    };

    const label =
        view === 'month'
            ? format(date, 'LLLL yyyy', { locale: pl })
            : view === 'week'
              ? format(date, "'Tydzień' w · LLLL yyyy", { locale: pl })
              : format(date, 'EEEE, d MMMM yyyy', { locale: pl });

    return (
        <div className={foundation.foundation} data-testid="v18-calendar-pilot">
            <div className={foundation.layout}>
                <nav
                    className={foundation.rail}
                    aria-label="Nawigacja Studio V18"
                >
                    <Link
                        href={dashboardHref}
                        className={foundation.railBrand}
                        aria-label="Dashboard V18"
                    >
                        B<span>/</span>W
                    </Link>
                    <Link
                        href={dashboardHref}
                        className={foundation.railLink}
                        aria-label="Dashboard V18"
                    >
                        <Squares2X2Icon
                            width={23}
                            height={23}
                            aria-hidden="true"
                        />
                    </Link>
                    <Link
                        href="/studio-v18/calendar"
                        className={`${foundation.railLink} ${foundation.railActive}`}
                        aria-current="page"
                        aria-label="Kalendarz V18"
                    >
                        <CalendarDaysIcon
                            width={23}
                            height={23}
                            aria-hidden="true"
                        />
                    </Link>
                    <Link
                        href="/studio-v18/customers"
                        className={foundation.railLink}
                        aria-label="Klienci V18"
                    >
                        <UsersIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                </nav>

                <main className={foundation.surface} id="main-content">
                    <div className={foundation.breadcrumbs}>
                        <Link href={dashboardHref}>Studio V18</Link>
                        <span aria-hidden="true">/</span>
                        <span>Kalendarz</span>
                    </div>
                    <div className={styles.heading}>
                        <div>
                            <span className={styles.eyebrow}>
                                Salon Black &amp; White · Kalendarz V18
                            </span>
                            <h1>Kalendarz</h1>
                            <p>
                                Wizyty, klienci i wolne terminy w jednym
                                miejscu.
                            </p>
                        </div>
                        <div className={styles.headingActions}>
                            <nav
                                className={styles.shortcuts}
                                aria-label="Codzienna praca"
                            >
                                <Link href="/studio-v18/customers">
                                    Klienci
                                </Link>
                                <Link href="/appointments">Wizyty</Link>
                            </nav>
                            <Link
                                href="/calendar"
                                className={styles.secondaryAction}
                            >
                                <ArrowLeftIcon
                                    width={16}
                                    height={16}
                                    aria-hidden="true"
                                />
                                Klasyczny kalendarz
                            </Link>
                            <button
                                className={styles.primaryAction}
                                type="button"
                                onClick={() =>
                                    openForCreate({ startTime: date })
                                }
                            >
                                <PlusIcon
                                    width={18}
                                    height={18}
                                    aria-hidden="true"
                                />
                                Nowa wizyta
                            </button>
                        </div>
                    </div>

                    <div
                        className={styles.overview}
                        aria-label="Podsumowanie wybranego okresu"
                        data-single-operator={
                            (data?.employees.length ?? 0) <= 1
                        }
                    >
                        <div className={styles.overviewCard}>
                            <span>Wizyty w okresie</span>
                            <strong>
                                {loading ? '—' : error ? '—' : counts.total}
                            </strong>
                            <small>Rzeczywiste dane kalendarza</small>
                        </div>
                        <div className={styles.overviewCard}>
                            <span>Potwierdzone</span>
                            <strong>
                                {loading || error ? '—' : counts.confirmed}
                            </strong>
                            <small>Status: potwierdzona</small>
                        </div>
                        <div className={styles.overviewCard}>
                            <span>Oczekujące</span>
                            <strong>
                                {loading || error ? '—' : counts.pending}
                            </strong>
                            <small>Online / przełożenie terminu</small>
                        </div>
                        {(data?.employees.length ?? 0) > 1 && (
                            <div className={styles.overviewCard}>
                                <span>Osoby w zespole</span>
                                <strong>{data?.employees.length}</strong>
                                <small>Według odpowiedzi API</small>
                            </div>
                        )}
                    </div>

                    <div className={styles.workspace}>
                        <section
                            className={styles.mainPanel}
                            aria-label="Kalendarz wizyt"
                        >
                            <div className={styles.toolbar}>
                                <div className={styles.dateNavigation}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDate((d) =>
                                                moveDate(d, view, -1),
                                            )
                                        }
                                        aria-label="Poprzedni okres"
                                        className={styles.iconButton}
                                    >
                                        <ChevronLeftIcon
                                            width={18}
                                            height={18}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <h2>{label}</h2>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDate((d) => moveDate(d, view, 1))
                                        }
                                        aria-label="Następny okres"
                                        className={styles.iconButton}
                                    >
                                        <ChevronRightIcon
                                            width={18}
                                            height={18}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.todayButton}
                                        onClick={() => setDate(new Date())}
                                    >
                                        Dzisiaj
                                    </button>
                                    <label
                                        className={styles.datePicker}
                                        htmlFor="v18-calendar-date"
                                    >
                                        <span>Przejdź do daty</span>
                                        <DatePicker
                                            id="v18-calendar-date"
                                            selected={date}
                                            onChange={handleDatePickerChange}
                                            locale={locale}
                                            // Keep ISO input for existing deep links
                                            // and browser tests, but localize the
                                            // popup's month/weekdays using the UI.
                                            dateFormat={['yyyy-MM-dd', 'P']}
                                            dateFormatCalendar="LLLL yyyy"
                                            calendarClassName={
                                                dateInputStyles.calendar
                                            }
                                            popperClassName={
                                                dateInputStyles.popper
                                            }
                                            portalId="salonbw-v18-calendar-date-popup"
                                            showPopperArrow={false}
                                            autoComplete="off"
                                        />
                                    </label>
                                </div>
                                <div
                                    className={styles.viewSwitch}
                                    role="group"
                                    aria-label="Widok kalendarza"
                                >
                                    {views.map((option) => (
                                        <button
                                            type="button"
                                            key={option.id}
                                            aria-pressed={view === option.id}
                                            onClick={() => setView(option.id)}
                                            className={
                                                view === option.id
                                                    ? styles.viewActive
                                                    : styles.viewButton
                                            }
                                        >
                                            {option.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {openingHoursState === 'unavailable' && (
                                <p className={styles.editNote} role="status">
                                    Nie udało się pobrać godzin otwarcia. Siatka
                                    pokazuje zakres domyślny, a nie potwierdzony
                                    grafik.
                                </p>
                            )}
                            {openingHoursState === 'ready' && (
                                <p className={styles.editNote} role="status">
                                    {openingHoursSource === 'timetables'
                                        ? weeklyClosedDay
                                            ? 'Zamknięte według grafiku tygodniowego. '
                                            : 'Godziny poza tygodniowym grafikiem są zacienione. '
                                        : openingHoursSource === 'branch'
                                          ? 'Brak aktywnego grafiku wykonawcy: pokazano godziny salonu. '
                                          : 'Brak potwierdzonego grafiku: pokazano godziny domyślne. '}
                                    Wyjątki konkretnego dnia i dostępność
                                    pracownika potwierdza system rezerwacji.
                                </p>
                            )}

                            {error ? (
                                <div className={styles.error} role="alert">
                                    Nie udało się pobrać wizyt. Żadne dane nie
                                    zostały zmienione.
                                    <button
                                        type="button"
                                        onClick={() => void refetch()}
                                    >
                                        Spróbuj ponownie
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.calendarSurface}>
                                    {view === 'week' && (
                                        <V18MobileWeekAgenda
                                            date={date}
                                            events={data?.events ?? []}
                                            onEventClick={handleEventClick}
                                        />
                                    )}
                                    <div
                                        className={
                                            view === 'week'
                                                ? styles.weekDesktopGrid
                                                : undefined
                                        }
                                    >
                                        <CalendarView
                                            events={data?.events ?? []}
                                            employees={data?.employees ?? []}
                                            loading={loading}
                                            currentDate={date}
                                            currentView={view}
                                            selectedEmployeeIds={employeeIds}
                                            businessHours={
                                                calendarHours?.businessHours
                                            }
                                            slotMinTime={
                                                calendarHours?.slotMinTime
                                            }
                                            slotMaxTime={
                                                calendarHours?.slotMaxTime
                                            }
                                            variant="v18"
                                            hideSidebar
                                            onEventClick={handleEventClick}
                                            onEventDrop={
                                                handleAppointmentDrop
                                            }
                                            onDateSelect={(
                                                start,
                                                end,
                                                employeeId,
                                            ) =>
                                                openForCalendarSlot(
                                                    start,
                                                    end,
                                                    employeeId,
                                                )
                                            }
                                            onTimeSlotClick={(start) =>
                                                openForCalendarSlot(start)
                                            }
                                            onDateChange={(nextDate) => {
                                                // FullCalendar's datesSet emits
                                                // currentStart (Monday for a
                                                // week), not the operator's
                                                // selected date. Ignore echoes
                                                // within the visible period or
                                                // a return from the customer
                                                // card shifts Tuesday to Monday.
                                                if (
                                                    toDateParam(nextDate) ===
                                                        toDateParam(date) ||
                                                    (view === 'week' &&
                                                        isSameWeek(
                                                            nextDate,
                                                            date,
                                                            {
                                                                weekStartsOn: 1,
                                                            },
                                                        )) ||
                                                    (view === 'month' &&
                                                        isSameMonth(
                                                            nextDate,
                                                            date,
                                                        ))
                                                ) {
                                                    return;
                                                }
                                                setDate(nextDate);
                                            }}
                                            onDayOpen={(nextDate) => {
                                                setDate(nextDate);
                                                setView('day');
                                            }}
                                            onViewChange={(next) => {
                                                if (next !== 'reception')
                                                    setView(next);
                                            }}
                                            onEmployeeFilterChange={
                                                setEmployeeIds
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                            <p className={styles.editNote}>
                                Przeciągnij wizytę, aby zmienić jej godzinę.
                                Zapis nastąpi dopiero po potwierdzeniu.
                            </p>
                            {moveError && (
                                <p className={styles.moveError} role="alert">
                                    {moveError}
                                </p>
                            )}
                        </section>

                        <aside
                            className={styles.aside}
                            aria-label="Zespół i najbliższe wizyty"
                        >
                            {(data?.employees.length ?? 0) > 1 && (
                                <section className={styles.asideCard}>
                                    <header className={styles.asideHeading}>
                                        <h2>Zespół</h2>
                                        <span>
                                            {data?.employees.length ?? 0}
                                        </span>
                                    </header>
                                    <p className={styles.asideHelp}>
                                        Zaznacz pracowników, których grafik
                                        chcesz wyświetlić.
                                    </p>
                                    <div className={styles.staff}>
                                        <button
                                            type="button"
                                            aria-pressed={
                                                employeeIds.length === 0
                                            }
                                            className={
                                                employeeIds.length === 0
                                                    ? styles.staffActive
                                                    : styles.staffButton
                                            }
                                            onClick={() => setEmployeeIds([])}
                                        >
                                            <span className={styles.staffMark}>
                                                W
                                            </span>{' '}
                                            Wszyscy pracownicy
                                        </button>
                                        {(data?.employees ?? []).map(
                                            (employee) => {
                                                const active =
                                                    employeeIds.includes(
                                                        employee.id,
                                                    );
                                                return (
                                                    <button
                                                        type="button"
                                                        key={employee.id}
                                                        aria-pressed={active}
                                                        className={
                                                            active
                                                                ? styles.staffActive
                                                                : styles.staffButton
                                                        }
                                                        onClick={() =>
                                                            setEmployeeIds(
                                                                (current) =>
                                                                    current.includes(
                                                                        employee.id,
                                                                    )
                                                                        ? current.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  employee.id,
                                                                          )
                                                                        : [
                                                                              ...current,
                                                                              employee.id,
                                                                          ],
                                                            )
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.staffMark
                                                            }
                                                            style={{
                                                                backgroundColor:
                                                                    employee.color ||
                                                                    undefined,
                                                            }}
                                                        >
                                                            {employee.name
                                                                .slice(0, 1)
                                                                .toLocaleUpperCase(
                                                                    'pl-PL',
                                                                )}
                                                        </span>
                                                        <span>
                                                            {employee.name}
                                                        </span>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                </section>
                            )}
                            <section className={styles.asideCard}>
                                <header className={styles.asideHeading}>
                                    <h2>Wizyty w okresie</h2>
                                    <ClockIcon
                                        width={18}
                                        height={18}
                                        aria-hidden="true"
                                    />
                                </header>
                                {loading ? (
                                    <p
                                        role="status"
                                        className={styles.asideHelp}
                                    >
                                        Ładowanie wizyt…
                                    </p>
                                ) : error ? (
                                    <p className={styles.asideHelp}>
                                        Dane są niedostępne.
                                    </p>
                                ) : visibleAppointments.length === 0 ? (
                                    <p className={styles.asideHelp}>
                                        Nie ma wizyt dla wybranego okresu i
                                        filtrów.
                                    </p>
                                ) : (
                                    <div className={styles.agenda}>
                                        {visibleAppointments
                                            .slice(0, 6)
                                            .map((appointment) => (
                                                <button
                                                    type="button"
                                                    key={appointment.id}
                                                    className={
                                                        styles.agendaItem
                                                    }
                                                    onClick={() =>
                                                        handleEventClick(
                                                            appointment,
                                                        )
                                                    }
                                                >
                                                    <time
                                                        dateTime={
                                                            appointment.startTime
                                                        }
                                                    >
                                                        {new Date(
                                                            appointment.startTime,
                                                        ).toLocaleString(
                                                            'pl-PL',
                                                            {
                                                                timeZone:
                                                                    'Europe/Warsaw',
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </time>
                                                    <span>
                                                        <strong>
                                                            {appointment.clientName ??
                                                                'Klient'}
                                                        </strong>
                                                        <small>
                                                            {appointment.serviceName ??
                                                                appointment.title}
                                                        </small>
                                                    </span>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </section>
                            <Link
                                href="/calendar"
                                className={styles.legacyLink}
                            >
                                <ArrowPathIcon
                                    width={17}
                                    height={17}
                                    aria-hidden="true"
                                />
                                Pełna obsługa kalendarza
                            </Link>
                        </aside>
                    </div>
                    <footer className={styles.footer}>
                        Studio V18 · Pilot DEV · Kalendarz korzysta z
                        istniejącego API
                    </footer>
                </main>
            </div>

            {pendingMove && (
                <div className={styles.moveOverlay}>
                    <section
                        className={styles.moveDialog}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="v18-move-heading"
                        aria-describedby="v18-move-description"
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') cancelPendingMove();
                        }}
                    >
                        <h2 id="v18-move-heading">Przełożyć wizytę?</h2>
                        <p id="v18-move-description">
                            <strong>{pendingMove.clientName}</strong>
                            {' · '}
                            {formatWarsawDateTime(pendingMove.startTime)}
                            {pendingMove.appointmentOverlap && (
                                <span className={styles.moveWarning}>
                                    Termin nakłada się na inną wizytę.
                                    Administrator może świadomie zatwierdzić
                                    wyjątek, ale nie obejść blokady czasu.
                                </span>
                            )}
                        </p>
                        <div className={styles.moveActions}>
                            <button
                                type="button"
                                className={styles.moveCancel}
                                disabled={savingMove}
                                onClick={cancelPendingMove}
                                autoFocus
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                className={styles.moveConfirm}
                                disabled={savingMove}
                                onClick={() => void confirmPendingMove()}
                            >
                                {savingMove
                                    ? 'Zapisywanie…'
                                    : pendingMove.appointmentOverlap
                                      ? 'Zatwierdź wyjątek'
                                      : 'Potwierdź termin'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
            <AppointmentQuickModal
                open={quickModal.event !== null}
                event={quickModal.event}
                appointment={quickModal.appointment}
                onClose={closeQuickModal}
                onOpenFull={promoteQuickToEdit}
                onChanged={() => void refetch()}
            />
            <AppointmentDrawer
                open={drawer.open}
                mode={drawer.mode}
                appointment={drawer.appointment}
                initialStartTime={drawer.initialStartTime}
                initialEndTime={drawer.initialEndTime}
                initialEmployeeId={drawer.initialEmployeeId}
                initialServiceId={drawer.initialServiceId}
                initialClientId={drawer.initialClientId}
                initialClientName={drawer.initialClientName}
                visualVariant="v18"
                onClose={close}
                onSaved={() => void refetch()}
            />
            <TimeBlockModal
                open={block !== null}
                employees={data?.employees ?? []}
                existingBlock={block}
                onClose={() => setBlock(null)}
                onSaved={() => void refetch()}
            />
        </div>
    );
}

export default function StudioV18CalendarPage() {
    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:calendar"
        >
            <Head>
                <title>Kalendarz V18 — Salon Black &amp; White</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <V18CalendarPilot />
        </RouteGuard>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
    const dev =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' ||
        process.env.NODE_ENV === 'development';
    if (
        !dev ||
        !['dev-panel.salon-bw.pl', 'localhost', '127.0.0.1'].includes(host)
    ) {
        return { notFound: true };
    }
    return { props: {} };
};
