import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type {
    EventClickArg,
    EventDropArg,
    DateSelectArg,
} from '@fullcalendar/core';
import type { PluginDef } from '@fullcalendar/core';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import CalendarSidebar from './CalendarSidebar';
import type { CalendarEvent, CalendarView as CalendarViewType } from '@/types';

// Dynamic import with no SSR to avoid hydration mismatches
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
    loading: () => (
        <div className="flex h-96 items-center justify-center rounded border border-dashed text-sm text-gray-600">
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
}

const VIEW_MAP: Record<CalendarViewType, string> = {
    day: 'timeGridDay',
    week: 'timeGridWeek',
    month: 'dayGridMonth',
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
        <div className="flex h-full flex-col md:flex-row">
            {/* Sidebar matches Versum layout: Left side filters */}
            <div className="w-full md:w-64 flex-shrink-0 border-r border-gray-200 bg-white">
                <CalendarSidebar
                    employees={employees}
                    selectedEmployeeIds={selectedEmployeeIds}
                    onEmployeeToggle={handleEmployeeToggle}
                    // Pass empty handlers for now if generic sidebar doesn't need them
                    onSelectAll={() =>
                        onEmployeeFilterChange(employees.map((e) => e.id))
                    }
                    onClearAll={() => onEmployeeFilterChange([])}
                    currentDate={currentDate}
                    onDateSelect={onDateChange}
                />
            </div>

            {/* Main Calendar Area */}
            <div className="flex-1 overflow-auto bg-white p-2">
                {/* Custom Header matching Versum's top bar usually goes here or in Layout */}

                {loading ? (
                    <div className="flex h-full items-center justify-center opacity-50">
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
                        selectable
                        editable
                        locale="pl"
                        firstDay={1}
                        slotMinTime="07:00:00"
                        slotMaxTime="21:00:00" // Versum usually ends late
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
                    <div className="p-4 text-center text-gray-500">
                        Initializing...
                    </div>
                )}
            </div>
        </div>
    );
}
