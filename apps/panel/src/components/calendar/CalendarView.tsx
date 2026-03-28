import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { EventDropArg } from '@fullcalendar/core';
import type { PluginDef } from '@fullcalendar/core';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import CalendarSidebar from './CalendarSidebar';
import type { CalendarEvent, CalendarView as CalendarViewType } from '@/types';

// Dynamic import with no SSR to avoid hydration mismatches
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
    loading: () => (
        <div className="d-flex h-96 align-items-center justify-content-center rounded border border-dashed small text-muted">
            Initialising calendar engine...
        </div>
    ),
});

interface CalendarViewProps {
    events: CalendarEvent[];
    employees: Array<{ id: number; name: string; color?: string }>;
    loading?: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onEventDrop: (
        eventId: number,
        newStart: Date,
        newEnd: Date,
        newEmployeeId?: number,
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

export default function CalendarView({
    events,
    employees,
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
            void onEventDrop(eventId, info.event.start, info.event.end);
        },
        [onEventDrop],
    );

    const handleDatesSet = useCallback(
        (arg: { view: { type: string } }) => {
            const viewType = arg.view.type;
            // Map FullCalendar view IDs to our canonical view enum.
            if (viewType === 'timeGridDay') onViewChange('day');
            else if (viewType === 'timeGridWeek') onViewChange('week');
            else if (viewType === 'dayGridMonth') onViewChange('month');
        },
        [onViewChange],
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

    return (
        <div className={`d-flex h-100 ${hideSidebar ? '' : 'flex-column '}`}>
            {/* Sidebar matches source layout: Left side filters */}
            {!hideSidebar && (
                <div className="w-100 flex-flex-shrink-0 border-end border-secondary border-opacity-25 bg-white">
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
                    <div className="d-flex h-100 align-items-center justify-content-center opacity-50">
                        Loading appointments...
                    </div>
                ) : calendarPlugins ? (
                    <FullCalendar
                        plugins={calendarPlugins}
                        initialView={VIEW_MAP[currentView]}
                        initialDate={currentDate}
                        events={fullCalendarEvents}
                        eventClick={(info) =>
                            onEventClick(
                                info.event.extendedProps
                                    .originalEvent as CalendarEvent,
                            )
                        }
                        eventDrop={handleEventDrop}
                        select={(info) => onDateSelect(info.start, info.end)}
                        datesSet={handleDatesSet}
                        selectable
                        editable
                        locale="pl"
                        firstDay={1}
                        slotMinTime="07:00:00"
                        slotMaxTime="21:00:00" // source UI usually ends late
                        slotDuration="00:15:00"
                        allDaySlot={false}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'timeGridDay,timeGridWeek,dayGridMonth',
                        }}
                        height="auto"
                        contentHeight="auto"
                        nowIndicator
                    />
                ) : (
                    <div className="p-3 text-center text-muted">
                        Initializing...
                    </div>
                )}
            </div>
        </div>
    );
}
