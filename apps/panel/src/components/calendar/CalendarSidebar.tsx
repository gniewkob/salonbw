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
        <div className="d-flex flex-column gap-2 p-2 overflow-auto">
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
                <div
                    className="pt-2 border-top"
                    style={{ borderColor: '#f0f0f0' }}
                >
                    <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                        <span
                            className="fw-bold text-muted text-uppercase"
                            style={{
                                fontSize: '0.7rem',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Pracownicy
                        </span>
                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                onClick={onSelectAll}
                                className="border-0 bg-transparent text-primary p-0"
                                style={{ fontSize: '0.75rem' }}
                            >
                                Wszyscy
                            </button>
                            <span className="text-muted">|</span>
                            <button
                                type="button"
                                onClick={onClearAll}
                                className="border-0 bg-transparent text-muted p-0"
                                style={{ fontSize: '0.75rem' }}
                            >
                                Wyczyść
                            </button>
                        </div>
                    </div>
                    <div className="d-flex flex-column gap-1">
                        {employees.map((emp) => (
                            <label
                                key={emp.id}
                                className="d-flex align-items-center gap-2 px-1 py-1 rounded"
                                style={{
                                    cursor: 'pointer',
                                    fontSize: '0.82rem',
                                }}
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
        </div>
    );
}
