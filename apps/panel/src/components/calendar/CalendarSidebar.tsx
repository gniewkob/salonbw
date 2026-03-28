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

        void router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, date: dateStr },
            },
            undefined,
            { shallow: true },
        );
    };

    return (
        <div className="d-flex flex-column gap-3 p-3">
            <div className="salonbw-datepicker-container">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    inline
                    locale="pl"
                    calendarClassName="salonbw-datepicker"
                />
            </div>

            <div className="salonbw-sidebar-section">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <h3 className="small fw-bold text-muted text-uppercase">
                        Pracownicy
                    </h3>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            onClick={onSelectAll}
                            className="small text-sky-600"
                        >
                            Wszyscy
                        </button>
                        <span className="text-secondary">|</span>
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="small text-muted"
                        >
                            Wyczyść
                        </button>
                    </div>
                </div>
                <div className="gap-1 max-h-64 overflow-y-auto">
                    {employees.map((emp) => {
                        const colorStyle = {
                            backgroundColor: emp.color || '#ccc',
                        };
                        return (
                            <label
                                key={emp.id}
                                className="d-flex align-items-center gap-2 small p-1 rounded"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedEmployeeIds.includes(
                                        emp.id,
                                    )}
                                    onChange={() => onEmployeeToggle(emp.id)}
                                    className="rounded border-secondary border-opacity-50 text-sky-600"
                                />
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-circle"
                                        style={colorStyle}
                                    />
                                    <span className="text-body">
                                        {emp.name}
                                    </span>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
