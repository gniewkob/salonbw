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
import { useToast } from '@/contexts/ToastContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';
import { useBookableEmployees } from '@/hooks/useEmployees';
import { classifyV18DropConflict } from '@/utils/v18CalendarDrop';
import { useDateInputLocale } from '@/hooks/useDateInputLocale';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
    computeSlotBounds,
    expandSlotBoundsForVisibleEvents,
    isDayClosed,
    toBusinessHours,
    type OpeningHoursResponse,
    type WeeklyHours,
} from '@/utils/openingHoursCalendar';
import { evaluateBookingOpeningHours } from '@/utils/v18BookingOpeningHours';
import { useAppointmentDrawer } from '@/hooks/calendar/useAppointmentDrawer';
import CalendarView from '@/components/calendar/CalendarView';
import V18MobileWeekAgenda from '@/components/v18/V18MobileWeekAgenda';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';
import ConfirmModal from '@/components/ConfirmModal';
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
 * The existing Calendar API and booking drawer remain the only scheduling
 * engines. V18 changes presentation; rescheduling by drag stays in /calendar
 * until its existing conflict + forced-overlap semantics are shared safely.
 */
export function V18CalendarPilot() {
    const { role, apiFetch } = useAuth();
    const toast = useToast();
    const { locale } = useDateInputLocale();
    const isMobile = useIsMobile();
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
            setView(restoredView === 'month' && isMobile ? 'day' : restoredView);
        }
        setRouteReady(true);
    }, [router.isReady, routeQuery.date, routeQuery.view, routeReady, isMobile]);

    // Seven month columns are unreadable on a phone. A mobile viewport,
    // including direct ?view=month links, falls back to the daily schedule.
    useEffect(() => {
        if (isMobile && view === 'month') setView('day');
    }, [isMobile, view]);

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
    // Slot choices and draft time blocks are local UI state. The backend is
    // called only after a user submits the existing TimeBlockModal form.
    const [slotAction, setSlotAction] = useState<{
        start: Date;
        end?: Date;
        employeeId?: number;
    } | null>(null);
    const [newBlock, setNewBlock] = useState<{
        start: Date;
        end?: Date;
        employeeId?: number;
    } | null>(null);
    const [dropError, setDropError] = useState<string | null>(null);
    const [pendingDrop, setPendingDrop] = useState<{
        id: number;
        startTime: string;
        endTime: string;
        employeeId: number;
        reason: 'overlap' | 'outside';
        approvedOverlap?: boolean;
        approvedOutside?: boolean;
    } | null>(null);
    const dropInFlight = useRef(false);
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
    const {
        data: roster,
        error: rosterError,
        refetch: refetchRoster,
    } = useBookableEmployees();
    const { rescheduleAppointment, checkConflicts } = useCalendarMutations();

    // Never preselect one person when roster and calendar results disagree.
    // A single-provider salon defaults to her; multi-staff stays explicit.
    const soleEmployeeId = roster
        ? roster.length === 1 &&
          (!data ||
              (data.employees.length === 1 &&
                  data.employees[0].id === roster[0].id))
            ? roster[0].id
            : undefined
        : data?.employees.length === 1
          ? data.employees[0].id
          : undefined;
    const defaultEmployeeId =
        employeeIds.length === 1
            ? employeeIds[0]
            : employeeIds.length === 0
              ? soleEmployeeId
              : undefined;

    // FullCalendar emits both select and dateClick for short gestures.
    // Show one choice only; nothing is persisted until the chosen form saves.
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
        ) return;
        lastSlotGesture.current = { start: start.getTime(), timestamp };
        setSlotAction({
            start,
            end: end && end > start ? end : undefined,
            employeeId: employeeId ?? defaultEmployeeId,
        });
    };

    const chooseSlotAppointment = () => {
        if (!slotAction) return;
        const selection = slotAction;
        setSlotAction(null);
        openForCreate({
            startTime: selection.start,
            endTime: selection.end,
            employeeId: selection.employeeId,
        });
    };

    const chooseSlotBlock = () => {
        if (!slotAction) return;
        setNewBlock(slotAction);
        setSlotAction(null);
    };

    const openBlockFromToolbar = () => {
        setNewBlock({
            start: new Date(date),
            end: new Date(date.getTime() + 60 * 60 * 1000),
            employeeId: defaultEmployeeId,
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
        // Weekly timetable defines the ordinary grid and shaded business
        // hours, but must never hide a real persisted evening/early booking.
        const weeklyBounds = openingHours
            ? computeSlotBounds(openingHours)
            : { slotMinTime: '07:00:00', slotMaxTime: '21:00:00' };
        const bounds = expandSlotBoundsForVisibleEvents(
            weeklyBounds,
            data?.events ?? [],
            date,
            view,
        );
        return {
            ...bounds,
            businessHours: openingHours
                ? toBusinessHours(openingHours)
                : undefined,
        };
    }, [openingHours, data?.events, date, view]);

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

    const verifyDropOpeningHours = async (start: Date, end: Date) => {
        try {
            const fresh = await apiFetch<OpeningHoursResponse>(
                '/calendar/opening-hours',
            );
            if (
                openingHoursState !== 'ready' ||
                !openingHours ||
                JSON.stringify(fresh.hours) !== JSON.stringify(openingHours) ||
                fresh.source !== openingHoursSource
            ) {
                setOpeningHours(fresh.hours);
                setOpeningHoursSource(fresh.source);
                setOpeningHoursState('ready');
                setDropError(
                    'Godziny otwarcia zmieniły się lub nie były dostępne. Sprawdź grafik i ponów przesunięcie.',
                );
                return null;
            }
            const result = evaluateBookingOpeningHours(start, end, fresh);
            if (result.status === 'unknown') {
                setDropError('Nie można potwierdzić godzin pracy. Przeniesienie wstrzymano.');
                return null;
            }
            return result;
        } catch {
            setDropError('Nie udało się sprawdzić godzin pracy. Przeniesienie wstrzymano.');
            return null;
        }
    };

    // FullCalendar renders the optimistic drag; the API owns the final
    // transaction and hard-block checks. A failed request always reverts.
    const handleEventDrop = async (
        id: number,
        start: Date,
        end: Date,
        targetEmployeeId?: number,
        revert?: () => void,
    ) => {
        if (dropInFlight.current) {
            revert?.();
            return;
        }
        const appointment = data?.events.find(
            (event) => event.id === id && event.type === 'appointment',
        );
        if (
            !appointment ||
            !Number.isFinite(start.getTime()) ||
            !Number.isFinite(end.getTime()) ||
            end <= start
        ) {
            revert?.();
            return;
        }
        dropInFlight.current = true;
        setPendingDrop(null);
        setDropError(null);
        try {
            const employeeId = targetEmployeeId ?? appointment.employeeId;
            const startTime = start.toISOString();
            const endTime = end.toISOString();
            const check = await checkConflicts(
                employeeId,
                startTime,
                endTime,
                id,
            );
            if (check.hasConflict) {
                const decision = classifyV18DropConflict(
                    check.conflictingEvents,
                    role,
                );
                // Never persist an overlapped visit without explicit admin
                // confirmation, even when the backend calendar setting permits it.
                if (decision === 'appointment-override') {
                    setPendingDrop({ id, startTime, endTime, employeeId, reason: 'overlap' });
                }
                setDropError(
                    decision === 'hard-block'
                        ? 'Ten termin jest zablokowany w grafiku.'
                        : decision === 'appointment-override'
                          ? 'Termin pokrywa się z inną wizytą. Zatwierdź świadome nałożenie terminów.'
                          : 'Termin jest zajęty. Wybierz inną godzinę.',
                );
                revert?.();
                return;
            }
            const hours = await verifyDropOpeningHours(start, end);
            if (!hours) {
                revert?.();
                return;
            }
            if (hours.status === 'outside') {
                if (role === 'admin') {
                    setPendingDrop({
                        id, startTime, endTime, employeeId, reason: 'outside',
                    });
                }
                setDropError(
                    'Termin poza godzinami pracy salonu (' +
                        hours.displayHours +
                        '). Przeniesienie wymaga świadomego zatwierdzenia wyjątku przez administratora.',
                );
                revert?.();
                return;
            }
            await rescheduleAppointment.mutateAsync({
                id,
                startTime,
                endTime,
                employeeId,
                // An owner-approved drag moves the visit; it is not a
                // proposal that should wait for the client's acceptance.
                ...(role === 'admin' &&
                (appointment.status === 'scheduled' ||
                    appointment.status === 'confirmed')
                    ? { confirmImmediately: true }
                    : {}),
            });
            await refetch();
        } catch {
            revert?.();
            setDropError(
                'Przeniesienie nie powiodło się. Odśwież kalendarz i spróbuj ponownie.',
            );
            await refetch();
        } finally {
            dropInFlight.current = false;
        }
    };

    const confirmPendingDrop = async () => {
        if (!pendingDrop || role !== 'admin' || dropInFlight.current) return;
        dropInFlight.current = true;
        try {
            // Recheck after confirmation: appointments can change, and a new
            // time block must never be bypassed by an admin force override.
            const check = await checkConflicts(
                pendingDrop.employeeId,
                pendingDrop.startTime,
                pendingDrop.endTime,
                pendingDrop.id,
            );
            const decision = check.hasConflict
                ? classifyV18DropConflict(check.conflictingEvents, role)
                : 'clear';
            if (decision !== 'clear' && decision !== 'appointment-override') {
                setPendingDrop(null);
                setDropError(
                    decision === 'hard-block'
                        ? 'W tym czasie pojawiła się blokada. Przeniesienie anulowano.'
                        : 'Nie można potwierdzić konfliktu. Odśwież kalendarz.',
                );
                return;
            }
            const hours = await verifyDropOpeningHours(
                new Date(pendingDrop.startTime),
                new Date(pendingDrop.endTime),
            );
            if (!hours) {
                setPendingDrop(null);
                return;
            }
            const approvedOverlap =
                pendingDrop.approvedOverlap === true ||
                pendingDrop.reason === 'overlap';
            const approvedOutside =
                pendingDrop.approvedOutside === true ||
                pendingDrop.reason === 'outside';
            if (
                decision === 'appointment-override' &&
                !approvedOverlap
            ) {
                setPendingDrop({
                    ...pendingDrop,
                    reason: 'overlap',
                    approvedOutside,
                });
                setDropError(
                    'Podczas potwierdzania pojawiła się kolizja z inną wizytą. ' +
                        'Zatwierdź także nałożenie terminów.',
                );
                return;
            }
            if (hours.status === 'outside' && !approvedOutside) {
                setPendingDrop({
                    ...pendingDrop,
                    reason: 'outside',
                    approvedOverlap,
                });
                setDropError(
                    'Wizyta jest poza godzinami pracy (' +
                        hours.displayHours +
                        '). Zatwierdź osobno wyjątek godzinowy.',
                );
                return;
            }
            const sourceAppointment = data?.events.find(
                (event) =>
                    event.id === pendingDrop.id &&
                    event.type === 'appointment',
            );
            await rescheduleAppointment.mutateAsync({
                id: pendingDrop.id,
                startTime: pendingDrop.startTime,
                endTime: pendingDrop.endTime,
                employeeId: pendingDrop.employeeId,
                ...(decision === 'appointment-override' ? { force: true } : {}),
                ...(sourceAppointment?.status === 'scheduled' ||
                sourceAppointment?.status === 'confirmed'
                    ? { confirmImmediately: true }
                    : {}),
            });
            setPendingDrop(null);
            setDropError(null);
            await refetch();
        } catch {
            setPendingDrop(null);
            setDropError(
                'Nie udało się zatwierdzić zmiany terminu. Spróbuj ponownie.',
            );
            await refetch();
        } finally {
            dropInFlight.current = false;
        }
    };

    // Context belongs to the user's drag operation, not to the header
    // above a potentially long day/week grid.
    const pendingSource = pendingDrop
        ? data?.events.find(
              (event) =>
                  event.type === 'appointment' && event.id === pendingDrop.id,
          )
        : null;
    const formatDropDate = (value: string) => {
        const parsed = new Date(value);
        return Number.isFinite(parsed.getTime())
            ? format(parsed, 'd MMMM yyyy, HH:mm', { locale: pl })
            : 'Nieznana data';
    };
    const dropSummary = pendingDrop
        ? [
              pendingSource?.clientName ?? pendingSource?.title ?? 'Wizyta',
              pendingSource?.startTime
                  ? 'Obecny termin: ' +
                    formatDropDate(pendingSource.startTime) + '.'
                  : '',
              'Nowy termin: ' +
                  formatDropDate(pendingDrop.startTime) +
                  ' – ' +
                  format(new Date(pendingDrop.endTime), 'HH:mm') + '.',
              dropError ??
                  'Potwierdź ten wyjątek, aby zapisać zmianę terminu.',
              'Bez potwierdzenia wizyta pozostaje w poprzednim terminie.',
          ]
              .filter(Boolean)
              .join(' ')
        : '';

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
                                className={`${styles.secondaryAction} ${styles.blockAction}`}
                                type="button"
                                onClick={openBlockFromToolbar}
                            >
                                <ClockIcon
                                    width={18}
                                    height={18}
                                    aria-hidden="true"
                                />
                                Blokuj czas
                            </button>
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
                        data-single-operator={(roster?.length ?? 0) <= 1}
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
                        {(roster?.length ?? 0) > 1 && (
                            <div className={styles.overviewCard}>
                                <span>Osoby w zespole</span>
                                <strong>{roster?.length}</strong>
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
                                    {views.filter((option) => !isMobile || option.id !== 'month').map((option) => (
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

                            {/* Blocking errors remain visible even when
                                the operator is scrolled deep into the grid.
                                An actionable override gets a real dialog. */}
                            {dropError && !pendingDrop && (
                                <div
                                    className={styles.dropToast}
                                    role="alert"
                                    data-testid="v18-calendar-drop-notice"
                                >
                                    <span>{dropError}</span>
                                    <button
                                        type="button"
                                        onClick={() => setDropError(null)}
                                        aria-label="Zamknij komunikat"
                                        className={styles.dropToastClose}
                                    >
                                        Zamknij
                                    </button>
                                </div>
                            )}
                            <ConfirmModal
                                open={Boolean(pendingDrop && role === 'admin')}
                                title={
                                    pendingDrop?.reason === 'outside'
                                        ? 'Wizyta poza godzinami pracy'
                                        : 'Potwierdź nałożenie wizyt'
                                }
                                message={dropSummary}
                                confirmLabel={
                                    pendingDrop?.reason === 'outside'
                                        ? 'Przenieś poza godzinami pracy'
                                        : 'Przenieś mimo konfliktu'
                                }
                                confirmVariant="warning"
                                onConfirm={() => void confirmPendingDrop()}
                                onCancel={() => {
                                    setPendingDrop(null);
                                    setDropError(null);
                                }}
                            />
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
                                            hideSidebar
                                            onEventClick={handleEventClick}
                                            onEventDrop={handleEventDrop}
                                            allowPendingAdminDrag={
                                                role === 'admin'
                                            }
                                            sideBySideOverlaps
                                            touchDragLongPressDelay={350}
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
                                                if (next !== 'reception' &&
                                                    !(isMobile && next === 'month'))
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
                                {isMobile
                                    ? view === 'week'
                                        ? 'W widoku tygodniowym dotknij wizyty, otwórz edycję i zmień termin. '
                                        : 'W widoku dnia przytrzymaj wizytę i przeciągnij lub otwórz edycję, aby zmienić termin. '
                                    : 'Przeciągnij wizytę na wybraną godzinę. '}
                                Administrator może potwierdzić nałożenie wizyt;
                                blokady czasu pozostają niedostępne.
                            </p>
                        </section>

                        <aside
                            className={`${styles.aside} ${(roster?.length ?? 0) > 1 || rosterError || employeeIds.length > 0 ? styles.asideMobileVisible : ''}`}
                            aria-label="Zespół i najbliższe wizyty"
                        >
                            {((roster?.length ?? 0) > 1 ||
                                rosterError ||
                                employeeIds.length > 0) && (
                                <section className={styles.asideCard}>
                                    <header className={styles.asideHeading}>
                                        <h2>Zespół</h2>
                                        {roster && <span>{roster.length}</span>}
                                    </header>
                                    <p className={styles.asideHelp}>
                                        Zaznacz pracowników, których grafik
                                        chcesz wyświetlić.
                                    </p>
                                    {rosterError && (
                                        <div
                                            role="alert"
                                            className={styles.asideHelp}
                                        >
                                            <p>
                                                Nie udało się pobrać listy
                                                wykonawców.
                                            </p>
                                            <button
                                                type="button"
                                                className={styles.staffButton}
                                                onClick={() =>
                                                    void refetchRoster()
                                                }
                                            >
                                                Ponów pobieranie zespołu
                                            </button>
                                        </div>
                                    )}
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
                                        {(roster ?? []).map((employee) => {
                                            const active = employeeIds.includes(
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
                                                    <span>{employee.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                            <section
                                className={`${styles.asideCard} ${styles.mobileHidden}`}
                            >
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
                        </aside>
                    </div>
                    <footer className={styles.footer}>
                        Studio V18 · Pilot DEV · Kalendarz korzysta z
                        istniejącego API
                    </footer>
                </main>
            </div>

            {slotAction && (
                <div
                    className={styles.slotActionOverlay}
                    role="presentation"
                    onClick={() => setSlotAction(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="v18-slot-action-title"
                        className={styles.slotActionDialog}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') setSlotAction(null);
                        }}
                    >
                        <h2 id="v18-slot-action-title">Co chcesz dodać?</h2>
                        <p>
                            {format(slotAction.start, 'd MMMM yyyy, HH:mm', {
                                locale: pl,
                            })}
                        </p>
                        <div className={styles.slotActionButtons}>
                            <button
                                type="button"
                                className={styles.primaryAction}
                                onClick={chooseSlotAppointment}
                                autoFocus
                            >
                                Wizyta
                            </button>
                            <button
                                type="button"
                                className={styles.secondaryAction}
                                onClick={chooseSlotBlock}
                            >
                                Blokada
                            </button>
                            <button
                                type="button"
                                className={styles.secondaryAction}
                                onClick={() => setSlotAction(null)}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
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
                onSaved={() => {
                    // Show visible confirmation only after the API returned a
                    // valid receipt (create) or the edit mutation succeeded.
                    toast.success(
                        drawer.mode === 'create'
                            ? 'Wizyta została utworzona'
                            : 'Zmiany wizyty zapisane',
                    );
                    void refetch();
                }}
            />
            <TimeBlockModal
                open={block !== null || newBlock !== null}
                employees={roster ?? data?.employees ?? []}
                existingBlock={block}
                initialStartTime={newBlock?.start}
                initialEndTime={newBlock?.end}
                initialEmployeeId={newBlock?.employeeId}
                onClose={() => {
                    setBlock(null);
                    setNewBlock(null);
                }}
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
