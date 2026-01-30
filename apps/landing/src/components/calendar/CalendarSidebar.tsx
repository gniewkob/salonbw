import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Employee } from '@/types';

interface CalendarSidebarProps {
    employees: Array<{ id: number; name: string; color?: string }>;
    selectedEmployeeIds: number[];
    onEmployeeToggle: (employeeId: number) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
    currentDate: Date;
    onDateSelect: (date: Date) => void;
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

export default function CalendarSidebar({
    employees,
    selectedEmployeeIds,
    onEmployeeToggle,
    onSelectAll,
    onClearAll,
    currentDate,
    onDateSelect,
}: CalendarSidebarProps) {
    const [miniCalendarMonth, setMiniCalendarMonth] = useState(currentDate);

    const monthStart = startOfMonth(miniCalendarMonth);
    const monthEnd = endOfMonth(miniCalendarMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getEmployeeColor = (index: number) =>
        EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];

    return (
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white">
            {/* Mini Calendar */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                        {format(miniCalendarMonth, 'LLLL yyyy', { locale: pl })}
                    </span>
                    <button
                        onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-gray-500 py-1"
                        >
                            {day}
                        </div>
                    ))}
                    {days.map((day) => {
                        const isCurrentMonth = isSameMonth(day, miniCalendarMonth);
                        const isSelected = isSameDay(day, currentDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onDateSelect(day)}
                                className={`
                                    text-center text-xs py-1 rounded
                                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                                    ${isSelected ? 'bg-primary text-white' : ''}
                                    ${isToday && !isSelected ? 'bg-primary/10 text-primary font-bold' : ''}
                                    ${!isSelected && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Employee Filter */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Pracownicy</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={onSelectAll}
                            className="text-xs text-primary hover:underline"
                        >
                            Wszyscy
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={onClearAll}
                            className="text-xs text-gray-500 hover:underline"
                        >
                            Wyczyść
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    {employees.map((employee, index) => {
                        const color = employee.color ?? getEmployeeColor(index);
                        const isSelected = selectedEmployeeIds.includes(employee.id);

                        return (
                            <label
                                key={employee.id}
                                className="flex items-center gap-2 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onEmployeeToggle(employee.id)}
                                    className="sr-only"
                                />
                                <span
                                    className={`
                                        w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                        ${isSelected ? 'border-current' : 'border-gray-300'}
                                    `}
                                    style={{
                                        borderColor: isSelected ? color : undefined,
                                        backgroundColor: isSelected ? color : 'transparent',
                                    }}
                                >
                                    {isSelected && (
                                        <svg
                                            className="h-3 w-3 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </span>
                                <span
                                    className={`text-sm ${
                                        isSelected ? 'text-gray-900' : 'text-gray-500'
                                    } group-hover:text-gray-900`}
                                >
                                    {employee.name}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 p-4">
                <button
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                    + Nowa wizyta
                </button>
            </div>
        </aside>
    );
}
