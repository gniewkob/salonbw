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

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        void router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, date: `${year}-${month}-${day}` },
            },
            undefined,
            { shallow: true },
        );
    };

    return (
        <aside className="salonbw-calendar-filter-panel">
            <div className="salonbw-datepicker-container">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    inline
                    locale="pl"
                    calendarClassName="salonbw-datepicker"
                />
            </div>

            {/* Employee filter — only shown when multiple employees */}
            {employees.length > 1 && (
                <div className="salonbw-calendar-filter-section">
                    <div className="salonbw-calendar-filter-section__header">
                        <span className="salonbw-calendar-filter-section__title">
                            Pracownicy
                        </span>
                        <div className="salonbw-calendar-filter-section__actions">
                            <button
                                type="button"
                                onClick={onSelectAll}
                                className="salonbw-calendar-filter-link"
                            >
                                Wszyscy
                            </button>
                            <button
                                type="button"
                                onClick={onClearAll}
                                className="salonbw-calendar-filter-link"
                            >
                                Wyczyść
                            </button>
                        </div>
                    </div>
                    <div className="salonbw-calendar-employee-list">
                        {employees.map((emp) => (
                            <label
                                key={emp.id}
                                className="salonbw-calendar-employee-option"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedEmployeeIds.includes(
                                        emp.id,
                                    )}
                                    onChange={() => onEmployeeToggle(emp.id)}
                                    className="form-check-input m-0 flex-shrink-0"
                                />
                                <span
                                    className="rounded-circle flex-shrink-0"
                                    style={{
                                        width: 10,
                                        height: 10,
                                        backgroundColor: emp.color ?? '#ccc',
                                        display: 'inline-block',
                                    }}
                                />
                                <span className="text-truncate">
                                    {emp.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
