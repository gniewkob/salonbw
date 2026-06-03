import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { PluginDef } from '@fullcalendar/core';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import CalendarSidebar from './CalendarSidebar';
import EventCard from './EventCard';
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
                Initialising calendar engine...
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
}: CalendarViewProps) {
    const CALENDAR_MIN_HEIGHT = 560;
    const calendarRef = useRef<FullCalendarComponent | null>(null);
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
                        : employees.find((e) => e.id === event.employeeId)
                              ?.color || '#3b82f6',
                borderColor:
                    event.type === 'time_block'
                        ? '#9ca3af'
                        : employees.find((e) => e.id === event.employeeId)
                              ?.color || '#3b82f6',
                extendedProps: {
                    originalEvent: event,
                    clientName: event.clientName,
                    employeeId: event.employeeId,
                },
                editable: event.type === 'appointment',
            })),
        [events, employees],
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
            // Map FullCalendar view IDs to our canonical view enum.
            if (viewType === 'timeGridDay') onViewChange('day');
            else if (viewType === 'timeGridWeek') onViewChange('week');
            else if (viewType === 'dayGridMonth') onViewChange('month');

            const nextDate = arg.view.currentStart;
            if (toDateKey(nextDate) !== toDateKey(currentDate)) {
                onDateChange(nextDate);
            }
        },
        [onViewChange, onDateChange, currentDate],
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

    useEffect(() => {
        const instance = calendarRef.current;
        if (!instance || typeof instance.getApi !== 'function') return;
        const api = instance.getApi();
        if (!api) return;
        api.gotoDate(currentDate);
    }, [currentDate]);

    useEffect(() => {
        const instance = calendarRef.current;
        if (!instance || typeof instance.getApi !== 'function') return;
        const api = instance.getApi();
        if (!api) return;
        const targetView = VIEW_MAP[currentView];
        if (api.view.type !== targetView) {
            api.changeView(targetView);
        }
    }, [currentView]);

    return (
        <div className="d-flex h-100">
            {/* Sidebar: hidden on mobile, shown on desktop (md+) */}
            {!hideSidebar && (
                <div
                    className="d-none d-md-flex flex-column flex-shrink-0 border-end border-secondary border-opacity-25 bg-white"
                    style={{ width: 220 }}
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
            <div className="flex-fill overflow-auto bg-white p-2">
                {/* Custom Header matching source top bar usually goes here or in Layout */}

                {pluginLoadError ? (
                    <div className="p-3 text-center small text-danger">
                        Calendar engine failed to load: {pluginLoadError}
                    </div>
                ) : loading ? (
                    <div
                        className="rounded border border-dashed bg-light p-3"
                        style={{ minHeight: CALENDAR_MIN_HEIGHT }}
                    >
                        <div className="small text-muted mb-3">
                            Loading appointments...
                        </div>
                        <div className="placeholder-glow d-flex flex-column gap-2">
                            <span className="placeholder col-12" />
                            <span className="placeholder col-12" />
                            <span className="placeholder col-8" />
                        </div>
                    </div>
                ) : calendarPlugins ? (
                    <div style={{ minHeight: CALENDAR_MIN_HEIGHT }}>
                        <FullCalendar
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
                                const employeeColor =
                                    original.employeeId !== undefined
                                        ? employees.find(
                                              (employee) =>
                                                  employee.id ===
                                                  original.employeeId,
                                          )?.color
                                        : undefined;
                                return (
                                    <EventCard
                                        event={enrichedEvent}
                                        employeeColor={employeeColor}
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
                            slotMinTime="07:00:00"
                            slotMaxTime="21:00:00" // source UI usually ends late
                            slotDuration="00:15:00"
                            allDaySlot={false}
                            headerToolbar={false}
                            height="auto"
                            contentHeight="auto"
                            nowIndicator
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
