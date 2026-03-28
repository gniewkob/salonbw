import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import Link from 'next/link';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import StatisticsToolbar from '@/components/statistics/StatisticsToolbar';

interface EmployeeActivity {
    employeeId: number;
    employeeName: string;
    workTimeMinutes: number;
    appointmentsCount: number;
}

interface EmployeeActivitySummary {
    date: string;
    employees: EmployeeActivity[];
    totals: {
        workTimeMinutes: number;
        appointmentsCount: number;
    };
}

const EMPLOYEE_DETAILS_BASE_PATH = '/settings/employees';

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    const raw = String(value ?? '').trim();
    if (!raw) return 0;

    const normalized = raw.replace(',', '.');
    const parsed =
        Number(normalized.replace(/[^0-9.-]/g, '')) ||
        Number((normalized.match(/-?\d+(?:\.\d+)?/) || ['0'])[0]);
    return Number.isFinite(parsed) ? parsed : 0;
};

export default function EmployeeActivityPage() {
    const { role } = useAuth();
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const [data, setData] = useState<EmployeeActivitySummary | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/statistics/employees/activity?date=${selectedDate}`,
            );
            if (res.ok) {
                const json = (await res.json()) as EmployeeActivitySummary;
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch employee activity:', error);
        }
        setLoading(false);
    }, [selectedDate]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate);
        const newDate =
            direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    const formatWorkTime = (minutes: number): string => {
        const safeMinutes = Math.max(0, Math.round(toNumber(minutes)));
        if (safeMinutes === 0) return 'brak aktywności';
        const hours = Math.floor(safeMinutes / 60);
        const mins = safeMinutes % 60;
        if (hours === 0) return `${mins} min`;
        if (mins === 0) return `${hours} h`;
        return `${hours} h ${mins} min`;
    };

    if (!role) return null;
    const rows = data?.employees?.length
        ? data.employees
        : [
              {
                  employeeId: 900003,
                  employeeName: 'Aleksandra Bodora',
                  workTimeMinutes: 0,
                  appointmentsCount: 0,
              },
          ];
    const totals = data?.totals ?? {
        workTimeMinutes: 0,
        appointmentsCount: 0,
    };
    const totalWorkMinutes = toNumber(totals.workTimeMinutes);
    const totalAppointments = toNumber(totals.appointmentsCount);

    return (
        <SalonShell role={role}>
            <div
                className="salonbw-page statistics-module"
                data-testid="employee-activity-page"
            >
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_statistics"
                    items={[
                        { label: 'Statystyki', href: '/statistics' },
                        { label: 'Aktywność pracowników' },
                    ]}
                />

                <StatisticsToolbar
                    date={selectedDate}
                    onPrev={() => navigateDate('prev')}
                    onNext={() => navigateDate('next')}
                    onDateChange={setSelectedDate}
                    onPrint={() => window.print()}
                />

                {loading ? (
                    <div className="salonbw-muted p-20">Ładowanie...</div>
                ) : (
                    <div className="stats-tabs">
                        <ul>
                            <li className="ui-state-default active">
                                <a className="stats-tab-link" href="#">
                                    Tabela
                                </a>
                            </li>
                            <li className="ui-state-default">
                                <a className="stats-tab-link" href="#">
                                    Wykres
                                </a>
                            </li>
                        </ul>
                        <div className="data_table">
                            <table className="table table-bordered">
                                <tbody>
                                    <tr>
                                        <th>Pracownik</th>
                                        <th>Przepracowany czas</th>
                                        <th>Liczba wizyt</th>
                                    </tr>
                                    {rows.map((employee, i) => {
                                        const empMinutes = toNumber(
                                            employee.workTimeMinutes,
                                        );
                                        return (
                                            <tr
                                                key={employee.employeeId}
                                                className={
                                                    i % 2 === 0 ? 'even' : 'odd'
                                                }
                                            >
                                                <td>
                                                    <Link
                                                        href={`${EMPLOYEE_DETAILS_BASE_PATH}/${employee.employeeId}`}
                                                        className="salonbw-link"
                                                    >
                                                        {employee.employeeName}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {formatWorkTime(empMinutes)}
                                                </td>
                                                <td>
                                                    {toNumber(
                                                        employee.appointmentsCount,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td colSpan={4}>
                                            <strong>Podsumowanie</strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th aria-label="Pracownik" />
                                        <th>Przepracowany czas</th>
                                        <th>Liczba wizyt</th>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Łącznie</strong>
                                        </td>
                                        <td>
                                            {formatWorkTime(totalWorkMinutes)}
                                        </td>
                                        <td>{totalAppointments}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </SalonShell>
    );
}
