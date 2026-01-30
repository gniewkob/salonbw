import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import type { PluginDef } from '@fullcalendar/core';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import CalendarHeader from './CalendarHeader';
import CalendarSidebar from './CalendarSidebar';
import type { CalendarEvent, CalendarView as CalendarViewType } from '@/types';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
    loading: () => (
        <div className="flex h-96 items-center justify-center rounded border border-dashed text-sm text-gray-600">
            Ładowanie kalendarza...
        </div>
    ),
});

interface CalendarViewProps {
    events: CalendarEvent[];
    employees: Array<{ id: number; name: string; color?: string }>;
    loading?: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onEventDrop: (eventId: number, newStart: Date, newEnd: Date, newEmployeeId?: number) => void;
    onDateSelect: (start: Date, end: Date, employeeId?: number) => void;
    onDateChange: (date: Date) => void;
    onViewChange: (view: CalendarViewType) => void;
    onEmployeeFilterChange: (employeeIds: number[]) => void;
    currentDate: Date;
    currentView: CalendarViewType;
    selectedEmployeeIds: number[];
}

const EMPLOYEE_COLORS = [
    '#4A90D9',
    '#7B68EE',
    '#FF6B6B',
    '#4ECDC4',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F8B500',
];

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
    const [calendarPlugins, setCalendarPlugins] = useState<PluginDef[] | null>(null);
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
                        : 'Nie udało się załadować kalendarza',
                );
                setCalendarPlugins([]);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const getEmployeeColor = useCallback(
        (employeeId: number) => {
            const index = employees.findIndex((e) => e.id === employeeId);
            return employees[index]?.color ?? EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];
        },
        [employees],
    );

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
                        ? getTimeBlockColor(event.blockType)
                        : getEmployeeColor(event.employeeId),
                borderColor:
                    event.type === 'time_block'
                        ? getTimeBlockBorderColor(event.blockType)
                        : getEmployeeColor(event.employeeId),
                extendedProps: {
                    originalEvent: event,
                    type: event.type,
                    clientName: event.clientName,
                    employeeId: event.employeeId,
                    employeeName: event.employeeName,
                    status: event.status,
                },
                editable: event.type === 'appointment',
            })),
        [events, getEmployeeColor],
    );

    const handleEventClick = useCallback(
        (info: EventClickArg) => {
            const originalEvent = info.event.extendedProps
                .originalEvent as CalendarEvent;
            onEventClick(originalEvent);
        },
        [onEventClick],
    );

    const handleEventDrop = useCallback(
        (info: EventDropArg) => {
            const eventParts = info.event.id.split('-');
            const eventType = eventParts[0];
            const eventId = parseInt(eventParts[1], 10);

            if (eventType !== 'appointment') {
                info.revert();
                return;
            }

            const newStart = info.event.start;
            const newEnd = info.event.end;

            if (!newStart || !newEnd) {
                info.revert();
                return;
            }

            onEventDrop(eventId, newStart, newEnd);
        },
        [onEventDrop],
    );

    const handleDateSelect = useCallback(
        (info: DateSelectArg) => {
            onDateSelect(info.start, info.end);
        },
        [onDateSelect],
    );

    const handleEmployeeToggle = useCallback(
        (employeeId: number) => {
            const newSelection = selectedEmployeeIds.includes(employeeId)
                ? selectedEmployeeIds.filter((id) => id !== employeeId)
                : [...selectedEmployeeIds, employeeId];
            onEmployeeFilterChange(newSelection);
        },
        [selectedEmployeeIds, onEmployeeFilterChange],
    );

    const handleSelectAllEmployees = useCallback(() => {
        onEmployeeFilterChange(employees.map((e) => e.id));
    }, [employees, onEmployeeFilterChange]);

    const handleClearEmployees = useCallback(() => {
        onEmployeeFilterChange([]);
    }, [onEmployeeFilterChange]);

    const handleTodayClick = useCallback(() => {
        onDateChange(new Date());
    }, [onDateChange]);

    return (
        <div className="flex h-full flex-col">
            <CalendarHeader
                date={currentDate}
                view={currentView}
                onDateChange={onDateChange}
                onViewChange={onViewChange}
                onTodayClick={handleTodayClick}
            />
            <div className="flex flex-1 overflow-hidden">
                <CalendarSidebar
                    employees={employees}
                    selectedEmployeeIds={selectedEmployeeIds}
                    onEmployeeToggle={handleEmployeeToggle}
                    onSelectAll={handleSelectAllEmployees}
                    onClearAll={handleClearEmployees}
                    currentDate={currentDate}
                    onDateSelect={onDateChange}
                />
                <main className="flex-1 overflow-auto bg-white p-4">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            Ładowanie...
                        </div>
                    ) : pluginLoadError ? (
                        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {pluginLoadError}
                        </div>
                    ) : calendarPlugins ? (
                        <FullCalendar
                            plugins={calendarPlugins}
                            initialView={VIEW_MAP[currentView]}
                            initialDate={currentDate}
                            events={fullCalendarEvents}
                            eventClick={handleEventClick}
                            eventDrop={handleEventDrop}
                            select={handleDateSelect}
                            selectable
                            editable
                            locale="pl"
                            firstDay={1}
                            slotMinTime="07:00:00"
                            slotMaxTime="21:00:00"
                            slotDuration="00:15:00"
                            slotLabelInterval="01:00:00"
                            slotLabelFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            }}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            }}
                            headerToolbar={false}
                            dayHeaderFormat={{
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                            }}
                            nowIndicator
                            height="100%"
                            eventContent={(info) => (
                                <div className="overflow-hidden">
                                    <div className="truncate font-medium text-xs">
                                        {info.event.title}
                                    </div>
                                    {info.event.extendedProps.clientName && (
                                        <div className="truncate text-[10px] opacity-75">
                                            {info.event.extendedProps.clientName}
                                        </div>
                                    )}
                                </div>
                            )}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center rounded border border-dashed text-sm text-gray-600">
                            Przygotowywanie kalendarza...
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function getTimeBlockColor(type?: string): string {
    const colors: Record<string, string> = {
        break: '#e5e7eb',
        vacation: '#d1fae5',
        training: '#dbeafe',
        sick: '#fee2e2',
        other: '#fef3c7',
    };
    return colors[type ?? 'other'] ?? '#e5e7eb';
}

function getTimeBlockBorderColor(type?: string): string {
    const colors: Record<string, string> = {
        break: '#9ca3af',
        vacation: '#34d399',
        training: '#3b82f6',
        sick: '#ef4444',
        other: '#f59e0b',
    };
    return colors[type ?? 'other'] ?? '#9ca3af';
}
