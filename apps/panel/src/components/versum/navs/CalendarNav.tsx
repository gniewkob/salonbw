'use client';

import { useRouter } from 'next/router';
import { useEmployees } from '@/hooks/useEmployees';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    addMonths,
    subMonths,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { useState, useEffect } from 'react';

export default function CalendarNav() {
    const router = useRouter();
    const { data: employees } = useEmployees();

    const dateParam = router.query.date as string;
    const urlEmployeeId = router.query.employeeId
        ? Number(router.query.employeeId)
        : undefined;

    const [selectedDate, setSelectedDate] = useState(
        dateParam ? new Date(dateParam) : new Date(),
    );

    // Local state for selected employees (multiple selection like in Versum)
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
        urlEmployeeId ? [urlEmployeeId] : [],
    );

    // Sync with URL
    useEffect(() => {
        if (dateParam) {
            setSelectedDate(new Date(dateParam));
        }
    }, [dateParam]);

    useEffect(() => {
        if (urlEmployeeId && !selectedEmployeeIds.includes(urlEmployeeId)) {
            setSelectedEmployeeIds([urlEmployeeId]);
        }
    }, [urlEmployeeId]);

    // Calendar grid logic
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    // Navigation handlers
    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        const query = { ...router.query, date: format(date, 'yyyy-MM-dd') };
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const handleEmployeeToggle = (employeeId: number) => {
        const newSelection = selectedEmployeeIds.includes(employeeId)
            ? selectedEmployeeIds.filter((id) => id !== employeeId)
            : [...selectedEmployeeIds, employeeId];

        setSelectedEmployeeIds(newSelection);

        // Sync with URL (use first selected for now, or none if empty)
        const query = { ...router.query };
        if (newSelection.length === 0) {
            delete query.employeeId;
        } else {
            query.employeeId = String(newSelection[0]);
        }
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const changeMonth = (delta: number) => {
        const newDate =
            delta > 0
                ? addMonths(selectedDate, delta)
                : subMonths(selectedDate, Math.abs(delta));
        handleDateClick(newDate);
    };

    const monthYear = format(selectedDate, 'LLLL yyyy', {
        locale: pl,
    }).toUpperCase();

    return (
        <>
            {/* Mini Calendar Header */}
            <div className="nav-header flex-between">
                <button
                    onClick={() => changeMonth(-1)}
                    className="btn btn-xs btn-link p-0"
                >
                    &lt;
                </button>
                <span>{monthYear}</span>
                <button
                    onClick={() => changeMonth(1)}
                    className="btn btn-xs btn-link p-0"
                >
                    &gt;
                </button>
            </div>

            {/* Mini Calendar Grid */}
            <div className="versum-mini-cal">
                <div className="versum-mini-cal__weekdays">
                    <span>pn</span>
                    <span>wt</span>
                    <span>śr</span>
                    <span>cz</span>
                    <span>pt</span>
                    <span>so</span>
                    <span>n</span>
                </div>
                <div className="versum-mini-cal__days">
                    {calendarDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const today = isToday(day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    versum-mini-cal__day
                                    ${!isCurrentMonth ? 'versum-mini-cal__day--other-month' : ''}
                                    ${isSelected ? 'versum-mini-cal__day--selected' : ''}
                                    ${today && !isSelected ? 'versum-mini-cal__day--today' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Employees Section */}
            <div className="nav-header">PRACOWNICY</div>
            <div className="versum-employee-filter">
                {employees?.map((employee) => (
                    <label
                        key={employee.id}
                        className="versum-employee-filter__item"
                    >
                        <input
                            type="checkbox"
                            checked={selectedEmployeeIds.includes(employee.id)}
                            onChange={() => handleEmployeeToggle(employee.id)}
                            className="versum-checkbox"
                        />
                        <span
                            className="versum-employee-filter__color"
                            style={{
                                backgroundColor: employee.color || '#999',
                            }}
                        />
                        <span className="versum-employee-filter__name">
                            {employee.name}
                        </span>
                    </label>
                ))}
            </div>
        </>
    );
}
