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
import { useState, useEffect, useMemo } from 'react';
import styles from '@/styles/CalendarNav.module.css';

export default function CalendarNav() {
    const router = useRouter();
    const { data: employees } = useEmployees();

    const dateParam = router.query.date as string;
    const urlEmployeeIdsParam = Array.isArray(router.query.employeeIds)
        ? router.query.employeeIds[0]
        : router.query.employeeIds;
    const urlEmployeeIds = useMemo(
        () =>
            urlEmployeeIdsParam
                ? urlEmployeeIdsParam
                      .split(',')
                      .map((value) => Number(value))
                      .filter((value) => Number.isInteger(value) && value > 0)
                : [],
        [urlEmployeeIdsParam],
    );

    const [selectedDate, setSelectedDate] = useState(
        dateParam ? new Date(dateParam) : new Date(),
    );

    // Local state for selected employees (multiple selection like in source UI)
    const [selectedEmployeeIds, setSelectedEmployeeIds] =
        useState<number[]>(urlEmployeeIds);

    // Sync with URL
    useEffect(() => {
        if (dateParam) {
            setSelectedDate(new Date(dateParam));
        }
    }, [dateParam]);

    useEffect(() => {
        setSelectedEmployeeIds(urlEmployeeIds);
    }, [urlEmployeeIds]);

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

        // Sync with URL
        const query = { ...router.query };
        if (newSelection.length === 0) {
            delete query.employeeIds;
        } else {
            query.employeeIds = newSelection.join(',');
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
    });

    return (
        <>
            {/* Isolated mini-calendar prevents legacy global CSS conflicts. */}
            <section className={styles.calendar} aria-label="Mini-kalendarz">
                <div className={styles.header}>
                    <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        className={styles.navButton}
                        aria-label="Poprzedni miesiąc"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <span className={styles.monthLabel} aria-live="polite">
                        {monthYear}
                    </span>
                    <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        className={styles.navButton}
                        aria-label="Następny miesiąc"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
                <div className={styles.weekdays} aria-hidden="true">
                    <span className={styles.weekday}>pn</span>
                    <span className={styles.weekday}>wt</span>
                    <span className={styles.weekday}>śr</span>
                    <span className={styles.weekday}>cz</span>
                    <span className={styles.weekday}>pt</span>
                    <span className={styles.weekday}>so</span>
                    <span className={styles.weekday}>n</span>
                </div>
                <div
                    className={styles.days}
                    role="group"
                    aria-label="Wybór dnia"
                >
                    {calendarDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const today = isToday(day);

                        return (
                            <button
                                type="button"
                                key={day.toISOString()}
                                onClick={() => handleDateClick(day)}
                                className={[
                                    styles.day,
                                    !isCurrentMonth ? styles.dayOutside : '',
                                    isSelected ? styles.daySelected : '',
                                    today && !isSelected ? styles.dayToday : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                aria-label={format(day, 'EEEE, d MMMM yyyy', {
                                    locale: pl,
                                })}
                                aria-pressed={isSelected}
                                aria-current={today ? 'date' : undefined}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Employees Section */}
            <div className="nav-header">PRACOWNICY</div>
            <div className="salonbw-employee-filter">
                {employees?.map((employee) => {
                    const colorStyle = {
                        backgroundColor: employee.color || '#999',
                    };
                    return (
                        <label
                            key={employee.id}
                            className="salonbw-employee-filter__item"
                        >
                            <input
                                type="checkbox"
                                checked={selectedEmployeeIds.includes(
                                    employee.id,
                                )}
                                onChange={() =>
                                    handleEmployeeToggle(employee.id)
                                }
                                className="salonbw-checkbox"
                            />
                            <span
                                className="salonbw-employee-filter__color"
                                style={colorStyle}
                            />
                            <span className="salonbw-employee-filter__name">
                                {employee.name}
                            </span>
                        </label>
                    );
                })}
            </div>
        </>
    );
}
