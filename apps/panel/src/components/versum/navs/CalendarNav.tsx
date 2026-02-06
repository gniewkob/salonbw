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

export default function CalendarNav() {
    const router = useRouter();
    const { data: employees } = useEmployees();

    const dateParam = router.query.date as string;
    const selectedDate = dateParam ? new Date(dateParam) : new Date();

    const selectedEmployeeId = router.query.employeeId
        ? Number(router.query.employeeId)
        : undefined;

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
        const query = { ...router.query, date: format(date, 'yyyy-MM-dd') };
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const handleEmployeeClick = (employeeId: number | undefined) => {
        const query = { ...router.query };
        if (employeeId === undefined) {
            delete query.employeeId;
        } else {
            query.employeeId = String(employeeId);
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

    return (
        <>
            <div className="nav-header">
                {format(selectedDate, 'LLLL yyyy', {
                    locale: pl,
                }).toUpperCase()}
                <div className="pull-right">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="btn btn-xs btn-link"
                    >
                        <i className="icon-chevron-left">&lt;</i>
                    </button>
                    <button
                        onClick={() => changeMonth(1)}
                        className="btn btn-xs btn-link"
                    >
                        <i className="icon-chevron-right">&gt;</i>
                    </button>
                </div>
            </div>

            <div className="versum-mini-cal">
                <div className="versum-mini-cal__weekdays">
                    <span>pn</span>
                    <span>wt</span>
                    <span>śr</span>
                    <span>cz</span>
                    <span>pt</span>
                    <span>so</span>
                    <span>nd</span>
                </div>
                <div className="versum-mini-cal__days">
                    {calendarDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    flex h-6 w-6 items-center justify-center rounded-full text-xs
                                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                                    ${isSelected ? 'bg-sky-500 text-white' : 'hover:bg-gray-100'}
                                    ${isToday(day) && !isSelected ? 'font-bold text-sky-500' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="nav-header">PRACOWNICY</div>
            <ul className="nav nav-list">
                <li className={!selectedEmployeeId ? 'active' : undefined}>
                    <a
                        href="javascript:;"
                        onClick={() => handleEmployeeClick(undefined)}
                    >
                        Wszyscy pracownicy
                    </a>
                </li>
                {employees?.map((employee) => (
                    <li
                        key={employee.id}
                        className={
                            selectedEmployeeId === employee.id
                                ? 'active'
                                : undefined
                        }
                    >
                        <a
                            href="javascript:;"
                            onClick={() => handleEmployeeClick(employee.id)}
                        >
                            <span className="versum-avatar-xs mr-2">
                                <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-white font-bold">
                                    {employee.name.charAt(0)}
                                </div>
                            </span>
                            {employee.name}
                        </a>
                    </li>
                ))}
            </ul>
        </>
    );
}
