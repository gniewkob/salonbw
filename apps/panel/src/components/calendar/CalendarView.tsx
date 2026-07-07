import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type {
    EventDropArg,
    PluginDef,
    DayHeaderContentArg,
    DayCellContentArg,
} from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import CalendarSidebar from './CalendarSidebar';
import EventCard, { getEventStatusVisual } from './EventCard';
import type {
    CalendarEvent,
    CalendarView as CalendarViewType,
    ReceptionAlertSeverityByCustomerId,
} from '@/types';
import type FullCalendarComponent from '@fullcalendar/react';

// Dynamic import with no SSR to avoid hydration mismatches
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
    loading: () => (
        <div
            className="rounded border border-dashed bg-light p-3"
            style={{ minHeight: 560 }}
        >
            <div className="small text-muted mb-3">
                Inicjowanie silnika kalendarza…
            </div>
            <div className="placeholder-glow d-flex flex-column gap-2">
                <span className="placeholder col-12" />
                <span className="placeholder col-12" />
                <span className="placeholder col-8" />
            </div>
        </div>
    ),
}) as typeof FullCalendarComponent;

interface CalendarViewProps {
    events: CalendarEvent[];
    employees: Array<{ id: number; name: string; color?: string }>;
    customerAlertSeverityById?: ReceptionAlertSeverityByCustomerId;
    loading?: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onEventDrop: (
        eventId: number,
        newStart: Date,
        newEnd: Date,
        newEmployeeId?: number,
        revert?: () => void,
    ) => Promise<void> | void;
    onDateSelect: (start: Date, end: Date, employeeId?: number) => void;
    onDateChange: (date: Date) => void;
    onViewChange: (view: CalendarViewType) => void;
    onEmployeeFilterChange: (employeeIds: number[]) => void;
    currentDate: Date;
    currentView: CalendarViewType;
    selectedEmployeeIds: number[];
    hideSidebar?: boolean; // When true, don't render sidebar (used in SalonShell)
    businessHours?: Array<{
        daysOfWeek: number[];
        startTime: string;
        endTime: string;
    }>;
    slotMinTime?: string;
    slotMaxTime?: string;
    /** When set (day view on a closed day), shown as a banner above the grid. */
    closedDayLabel?: string | null;
}

const VIEW_MAP: Record<CalendarViewType, string> = {
    day: 'timeGridDay',
    week: 'timeGridWeek',
    month: 'dayGridMonth',
    reception: 'timeGridDay',
};

function toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Polish plural for "rezerwacja" (1) / "rezerwacje" (2–4) / "rezerwacji". */
function rezerwacjeLabel(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (n === 1) return 'rezerwacja';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return 'rezerwacje';
    }
    return 'rezerwacji';
}

export default function CalendarView({
    events,
    employees,
    customerAlertSeverityById = {},
    loading,
    onEventClick,
    onEventDrop,
    onDateSelect,
    onDateChange,
    onViewChange,
    onEmployeeFilterChange,
    currentDate,
    currentView,
    selectedEmployeeIds,
    hideSidebar = false,
    businessHours,
    slotMinTime = '07:00:00',
    slotMaxTime = '21:00:00',
    closedDayLabel = null,
}: CalendarViewProps) {
    const CALENDAR_MIN_HEIGHT = 560;
    const calendarRef = useRef<FullCalendarComponent | null>(null);
    const showSidebar = !hideSidebar && employees.length > 1;
    const [calendarPlugins, setCalendarPlugins] = useState<PluginDef[] | null>(
        null,
    );
    const [pluginLoadError, setPluginLoadError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        void getCalendarPlugins()
            .then((plugins) => {
                if (mounted) {
                    setCalendarPlugins(plugins);
                    setPluginLoadError(null);
                }
            })
            .catch((err) => {
                if (!mounted) return;
                setPluginLoadError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load calendar core',
                );
                setCalendarPlugins([]);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const fullCalendarEvents = useMemo(
        () =>
            events.map((event) => ({
                id: `${event.type}-${event.id}`,
                title: event.title,
                start: event.startTime,
                end: event.endTime,
                allDay: event.allDay ?? false,
                backgroundColor:
                    event.type === 'time_block'
                        ? '#e5e7eb'
                        : getEventStatusVisual(event.status).strip,
                borderColor:
                    event.type === 'time_block'
                        ? '#9ca3af'
                        : getEventStatusVisual(event.status).strip,
                extendedProps: {
                    originalEvent: event,
                    clientName: event.clientName,
                    employeeId: event.employeeId,
                },
                editable: event.type === 'appointment',
            })),
        [events],
    );

    // Reservations per day (appointments only — not time blocks) for the
    // Booksy-style per-day counters in the week header and month cells.
    const countByDay = useMemo(() => {
        const map: Record<string, number> = {};
        for (const event of events) {
            if (event.type !== 'appointment') continue;
            const key = toDateKey(new Date(event.startTime));
            map[key] = (map[key] ?? 0) + 1;
        }
        return map;
    }, [events]);

    const renderDayHeader = useCallback(
        (arg: DayHeaderContentArg) => {
            // Month header is a weekday name spanning many dates — no count.
            if (arg.view.type === 'dayGridMonth') return arg.text;
            const count = countByDay[toDateKey(arg.date)] ?? 0;
            return (
                <span
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        lineHeight: 1.25,
                    }}
                >
                    <span>{arg.text}</span>
                    {count > 0 && (
                        <span
                            style={{
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                color: '#6e7278',
                                marginTop: 2,
                                letterSpacing: 0,
                                textTransform: 'none',
                            }}
                        >
                            {count} {rezerwacjeLabel(count)}
                        </span>
                    )}
                </span>
            );
        },
        [countByDay],
    );

    const renderDayCell = useCallback(
        (arg: DayCellContentArg) => {
            const count = countByDay[toDateKey(arg.date)] ?? 0;
            return (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    <span>{arg.dayNumberText}</span>
                    {count > 0 && (
                        <span
                            aria-label={`${count} ${rezerwacjeLabel(count)}`}
                            style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                background: '#0d0d0d',
                                borderRadius: 10,
                                padding: '0 6px',
                                lineHeight: '16px',
                                minWidth: 18,
                                textAlign: 'center',
                            }}
                        >
                            {count}
                        </span>
                    )}
                </span>
            );
        },
        [countByDay],
    );

    const handleEventDrop = useCallback(
        (info: EventDropArg) => {
            const eventParts = info.event.id.split('-');
            const eventId = parseInt(eventParts[1], 10);
            if (!info.event.start || !info.event.end) return;
            void onEventDrop(
                eventId,
                info.event.start,
                info.event.end,
                undefined,
                info.revert,
            );
        },
        [onEventDrop],
    );

    const handleEventResize = useCallback(
        (info: EventResizeDoneArg) => {
            const eventParts = info.event.id.split('-');
            const eventId = parseInt(eventParts[1], 10);
            if (!info.event.start || !info.event.end) return;
            void onEventDrop(
                eventId,
                info.event.start,
                info.event.end,
                undefined,
                info.revert,
            );
        },
        [onEventDrop],
    );

    const handleDatesSet = useCallback(
        (arg: { view: { type: string; currentStart: Date } }) => {
            const viewType = arg.view.type;
            // Map FullCalendar view IDs to our canonical view enum. Only report
            // a change when FullCalendar genuinely differs from our state (e.g.
            // an FC-initiated change) — echoing back the view we just applied
            // raced with our own state updates and reverted the selection.
            const mapped: CalendarViewType | null =
                viewType === 'timeGridDay'
                    ? 'day'
                    : viewType === 'timeGridWeek'
                      ? 'week'
                      : viewType === 'dayGridMonth'
                        ? 'month'
                        : null;
            if (mapped && mapped !== currentView) {
                onViewChange(mapped);
            }

            const nextDate = arg.view.currentStart;
            if (toDateKey(nextDate) !== toDateKey(currentDate)) {
                onDateChange(nextDate);
            }
        },
        [onViewChange, onDateChange, currentDate, currentView],
    );

    // Sidebar handlers
    const handleEmployeeToggle = useCallback(
        (employeeId: number) => {
            const newSelection = selectedEmployeeIds.includes(employeeId)
                ? selectedEmployeeIds.filter((id) => id !== employeeId)
                : [...selectedEmployeeIds, employeeId];
            onEmployeeFilterChange(newSelection);
        },
        [selectedEmployeeIds, onEmployeeFilterChange],
    );

    // Keep FullCalendar's view + date in sync with our state in ONE effect.
    // Two separate effects raced: gotoDate fired `datesSet` while still in the
    // old view, and handleDatesSet mapped that back to onViewChange(old view),
    // reverting the view the user just picked (month→day/week looked stuck on
    // month). changeView(view, date) switches view AND navigates atomically, so
    // datesSet fires once with the correct view + date.
    useEffect(() => {
        const instance = calendarRef.current;
        if (!instance || typeof instance.getApi !== 'function') return;
        const api = instance.getApi();
        if (!api) return;
        const targetView = VIEW_MAP[currentView];
        if (api.view.type !== targetView) {
            api.changeView(targetView, currentDate);
        } else if (toDateKey(api.getDate()) !== toDateKey(currentDate)) {
            api.gotoDate(currentDate);
        }
    }, [currentView, currentDate]);

    return (
        <div
            className={
                showSidebar
                    ? 'salonbw-calendar-workspace'
                    : 'salonbw-calendar-workspace salonbw-calendar-workspace--no-sidebar'
            }
        >
            {/* Sidebar: hidden on mobile, shown on desktop (md+) */}
            {showSidebar && (
                <div
                    className="salonbw-calendar-sidebar"
                    aria-label="Filtry kalendarza"
                >
                    <CalendarSidebar
                        employees={employees}
                        selectedEmployeeIds={selectedEmployeeIds}
                        onEmployeeToggle={handleEmployeeToggle}
                        onSelectAll={() =>
                            onEmployeeFilterChange(employees.map((e) => e.id))
                        }
                        onClearAll={() => onEmployeeFilterChange([])}
                        currentDate={currentDate}
                        onDateSelect={onDateChange}
                    />
                </div>
            )}

            {/* Main Calendar Area */}
            <div className="salonbw-calendar-main">
                {/* Custom Header matching source top bar usually goes here or in Layout */}

                {pluginLoadError ? (
                    <div className="p-3 text-center small text-danger">
                        Nie udało się załadować kalendarza: {pluginLoadError}
                    </div>
                ) : loading ? (
                    <div
                        className="rounded border border-dashed bg-light p-3"
                        style={{ minHeight: CALENDAR_MIN_HEIGHT }}
                    >
                        <div className="small text-muted mb-3">
                            Ładowanie wizyt…
                        </div>
                        <div className="placeholder-glow d-flex flex-column gap-2">
                            <span className="placeholder col-12" />
                            <span className="placeholder col-12" />
                            <span className="placeholder col-8" />
                        </div>
                    </div>
                ) : calendarPlugins ? (
                    <div
                        className={`salonbw-calendar-frame salonbw-calendar-frame--${currentView}`}
                        style={{ minHeight: CALENDAR_MIN_HEIGHT }}
                    >
                        {currentView === 'day' && employees.length > 1 && (
                            <div className="salonbw-calendar-staff-strip">
                                {employees
                                    .filter(
                                        (employee) =>
                                            selectedEmployeeIds.length === 0 ||
                                            selectedEmployeeIds.includes(
                                                employee.id,
                                            ),
                                    )
                                    .slice(0, 3)
                                    .map((employee) => (
                                        <div
                                            key={employee.id}
                                            className="salonbw-calendar-staff-strip__person"
                                        >
                                            <span
                                                className="salonbw-calendar-staff-strip__dot"
                                                style={{
                                                    background:
                                                        employee.color ??
                                                        '#b4b8be',
                                                }}
                                            />
                                            <span className="text-truncate">
                                                {employee.name}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                        {closedDayLabel && (
                            <div
                                className="d-flex align-items-center gap-2 rounded mb-2 px-3 py-2"
                                role="status"
                                style={{
                                    background: '#f3f4f6',
                                    border: '1px solid #e5e7eb',
                                    color: '#6e7278',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                }}
                            >
                                <span aria-hidden="true">🔒</span>
                                {closedDayLabel}
                            </div>
                        )}
                        <FullCalendar
                            // Remount on view change: switching view via
                            // changeView() raced with the datesSet → onViewChange
                            // echo and left the grid stuck (e.g. month grid while
                            // the URL said day). Keying by view forces a clean
                            // mount with the right initialView, no race. Date-only
                            // navigation keeps the same key (no remount) and is
                            // handled by gotoDate in the effect below.
                            key={currentView}
                            ref={calendarRef}
                            plugins={calendarPlugins}
                            initialView={VIEW_MAP[currentView]}
                            initialDate={currentDate}
                            events={fullCalendarEvents}
                            eventContent={(info) => {
                                const original = info.event.extendedProps
                                    .originalEvent as CalendarEvent;
                                const alertSeverity =
                                    original.clientId !== undefined
                                        ? customerAlertSeverityById[
                                              original.clientId
                                          ]
                                        : undefined;
                                const enrichedEvent: CalendarEvent = {
                                    ...original,
                                    customerAlertSeverity: alertSeverity,
                                    hasCustomerAlerts: Boolean(alertSeverity),
                                };
                                return (
                                    <EventCard
                                        event={enrichedEvent}
                                        onClick={onEventClick}
                                    />
                                );
                            }}
                            eventClick={(info) =>
                                onEventClick(
                                    info.event.extendedProps
                                        .originalEvent as CalendarEvent,
                                )
                            }
                            eventDrop={handleEventDrop}
                            eventResize={handleEventResize}
                            select={(info) =>
                                onDateSelect(info.start, info.end)
                            }
                            datesSet={handleDatesSet}
                            selectable
                            editable
                            eventResizableFromStart
                            locale="pl"
                            firstDay={1}
                            businessHours={businessHours ?? false}
                            slotMinTime={slotMinTime}
                            slotMaxTime={slotMaxTime}
                            slotDuration="00:15:00"
                            slotLabelInterval="01:00:00"
                            scrollTime="08:00:00"
                            dayHeaderFormat={{
                                weekday: 'short',
                                day: 'numeric',
                            }}
                            dayHeaderContent={renderDayHeader}
                            dayCellContent={renderDayCell}
                            views={{
                                // Month columns are weekdays only — the date
                                // belongs in each cell, not the header (the
                                // global weekday+day format is for day/week).
                                dayGridMonth: {
                                    dayHeaderFormat: { weekday: 'long' },
                                    // Booksy-style: show only the current
                                    // month's days. Hide adjacent-month filler
                                    // (no grey "1 2 … 12" from next month) and
                                    // don't pad to a fixed 6 weeks.
                                    showNonCurrentDates: false,
                                    fixedWeekCount: false,
                                },
                            }}
                            nowIndicator
                            allDaySlot={false}
                            headerToolbar={false}
                            height="auto"
                            contentHeight="auto"
                        />
                    </div>
                ) : (
                    <div className="p-3 text-center text-muted">
                        Initializing...
                    </div>
                )}
            </div>
        </div>
    );
}
