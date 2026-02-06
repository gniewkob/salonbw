import { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { useEmployees } from '@/hooks/useEmployees';

registerLocale('pl', pl);

export default function CalendarSidebar() {
    const router = useRouter();
    const { date: dateParam, employeeId } = router.query;
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const { data: employees } = useEmployees();

    // Sync state with URL
    useEffect(() => {
        if (dateParam) {
            setSelectedDate(new Date(dateParam as string));
        }
    }, [dateParam]);

    const handleDateChange = (date: Date | null) => {
        if (!date) return;
        setSelectedDate(date);

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

    const toggleEmployee = (id: number) => {
        // Simple single selection for now, like the URL logic in calendar.tsx
        // or toggle logic if we support multiple.
        // calendar.tsx currently supports single employeeIdParam.

        const currentId = Number(employeeId);
        if (currentId === id) {
            // Deselect
            const { employeeId: _, ...rest } = router.query;
            router.push({ pathname: router.pathname, query: rest }, undefined, {
                shallow: true,
            });
        } else {
            router.push(
                {
                    pathname: router.pathname,
                    query: { ...router.query, employeeId: id },
                },
                undefined,
                { shallow: true },
            );
        }
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
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                    Pracownicy
                </h3>
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                            type="checkbox"
                            checked={!employeeId}
                            onChange={() => {
                                const { employeeId: _, ...rest } = router.query;
                                router.push(
                                    { pathname: router.pathname, query: rest },
                                    undefined,
                                    { shallow: true },
                                );
                            }}
                            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span
                            className={
                                !employeeId
                                    ? 'font-medium text-gray-900'
                                    : 'text-gray-700'
                            }
                        >
                            Wszyscy
                        </span>
                    </label>
                    {employees?.map((emp) => (
                        <label
                            key={emp.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                            <input
                                type="checkbox"
                                checked={Number(employeeId) === emp.id}
                                onChange={() => toggleEmployee(emp.id)}
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
                                    {emp.firstName} {emp.lastName}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
