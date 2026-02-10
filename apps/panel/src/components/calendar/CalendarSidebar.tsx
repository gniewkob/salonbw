'use client';

import { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale';
import { useRouter } from 'next/router';

registerLocale('pl', pl);

interface Employee {
    id: number;
    name: string;
    color?: string;
}

interface CalendarSidebarProps {
    employees: Employee[];
    selectedEmployeeIds: number[];
    onEmployeeToggle: (employeeId: number) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}

export default function CalendarSidebar({
    employees,
    selectedEmployeeIds,
    onEmployeeToggle,
    onSelectAll,
    onClearAll,
    currentDate,
    onDateSelect,
}: CalendarSidebarProps) {
    const router = useRouter();
    const { date: dateParam } = router.query;
    const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

    // Sync state with URL and props
    useEffect(() => {
        if (dateParam) {
            setSelectedDate(new Date(dateParam as string));
        } else {
            setSelectedDate(currentDate);
        }
    }, [dateParam, currentDate]);

    const handleDateChange = (date: Date | null) => {
        if (!date) return;
        setSelectedDate(date);
        onDateSelect(date);

        // Update URL
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, date: dateStr },
            },
            undefined,
            { shallow: true },
        );
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="versum-datepicker-container">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    inline
                    locale="pl"
                    calendarClassName="versum-datepicker"
                />
            </div>

            <div className="versum-sidebar-section">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase">
                        Pracownicy
                    </h3>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onSelectAll}
                            className="text-xs text-sky-600 hover:text-sky-700"
                        >
                            Wszyscy
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            Wyczyść
                        </button>
                    </div>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {employees.map((emp) => (
                        <label
                            key={emp.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                            <input
                                type="checkbox"
                                checked={selectedEmployeeIds.includes(emp.id)}
                                onChange={() => onEmployeeToggle(emp.id)}
                                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: emp.color || '#ccc',
                                    }}
                                />
                                <span className="text-gray-700">
                                    {emp.name}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
