import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, subDays } from 'date-fns';
import Link from 'next/link';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
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
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');

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

    const rows = useMemo(() => data?.employees ?? [], [data]);
    const totals = data?.totals ?? {
        workTimeMinutes: 0,
        appointmentsCount: 0,
    };
    const totalWorkMinutes = toNumber(totals.workTimeMinutes);
    const totalAppointments = toNumber(totals.appointmentsCount);
    const hasEmployeeActivity = rows.length > 0;
    const chartData = useMemo(
        () =>
            rows.map((employee) => ({
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                shortName:
                    employee.employeeName.split(' ')[0] ||
                    employee.employeeName,
                workHours:
                    Math.round((toNumber(employee.workTimeMinutes) / 60) * 10) /
                    10,
                appointmentsCount: toNumber(employee.appointmentsCount),
            })),
        [rows],
    );

    if (!role) return null;

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
                            <li
                                className={`ui-state-default${activeTab === 'table' ? ' active' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="stats-tab-link"
                                    onClick={() => setActiveTab('table')}
                                >
                                    Tabela
                                </button>
                            </li>
                            <li
                                className={`ui-state-default${activeTab === 'chart' ? ' active' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="stats-tab-link"
                                    onClick={() => setActiveTab('chart')}
                                >
                                    Wykres
                                </button>
                            </li>
                        </ul>
                        {activeTab === 'table' ? (
                            <div className="data_table">
                                <table className="table table-bordered">
                                    <tbody>
                                        <tr>
                                            <th>Pracownik</th>
                                            <th>Przepracowany czas</th>
                                            <th>Liczba wizyt</th>
                                        </tr>
                                        {hasEmployeeActivity ? (
                                            rows.map((employee, i) => {
                                                const empMinutes = toNumber(
                                                    employee.workTimeMinutes,
                                                );
                                                return (
                                                    <tr
                                                        key={
                                                            employee.employeeId
                                                        }
                                                        className={
                                                            i % 2 === 0
                                                                ? 'even'
                                                                : 'odd'
                                                        }
                                                    >
                                                        <td>
                                                            <Link
                                                                href={`${EMPLOYEE_DETAILS_BASE_PATH}/${employee.employeeId}`}
                                                                className="salonbw-link"
                                                            >
                                                                {
                                                                    employee.employeeName
                                                                }
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            {formatWorkTime(
                                                                empMinutes,
                                                            )}
                                                        </td>
                                                        <td>
                                                            {toNumber(
                                                                employee.appointmentsCount,
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr className="even">
                                                <td
                                                    colSpan={3}
                                                    className="salonbw-muted"
                                                >
                                                    Brak aktywności pracowników
                                                    dla wybranego dnia.
                                                </td>
                                            </tr>
                                        )}
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
                                                {formatWorkTime(
                                                    totalWorkMinutes,
                                                )}
                                            </td>
                                            <td>{totalAppointments}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="salonbw-widget">
                                <div className="salonbw-widget__header">
                                    Aktywność pracowników w dniu{' '}
                                    {format(
                                        new Date(`${selectedDate}T12:00:00`),
                                        'dd.MM.yyyy',
                                    )}
                                </div>
                                {hasEmployeeActivity ? (
                                    <div
                                        className="salonbw-widget__content"
                                        style={{ height: 360 }}
                                    >
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={chartData}
                                                margin={{
                                                    top: 16,
                                                    right: 16,
                                                    left: 8,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="shortName"
                                                    interval={0}
                                                />
                                                <YAxis
                                                    yAxisId="hours"
                                                    width={72}
                                                    tickFormatter={(value) =>
                                                        `${value} h`
                                                    }
                                                />
                                                <YAxis
                                                    yAxisId="appointments"
                                                    orientation="right"
                                                    allowDecimals={false}
                                                    width={48}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value:
                                                            | number
                                                            | string
                                                            | undefined,
                                                        name:
                                                            | string
                                                            | undefined,
                                                    ) => {
                                                        const numericValue =
                                                            typeof value ===
                                                            'number'
                                                                ? value
                                                                : Number(
                                                                      value ??
                                                                          0,
                                                                  );
                                                        const label =
                                                            name ??
                                                            'Liczba wizyt';
                                                        if (
                                                            label ===
                                                            'Przepracowany czas'
                                                        ) {
                                                            return [
                                                                formatWorkTime(
                                                                    Math.round(
                                                                        numericValue *
                                                                            60,
                                                                    ),
                                                                ),
                                                                label,
                                                            ];
                                                        }
                                                        return [
                                                            `${numericValue} wizyt`,
                                                            label,
                                                        ];
                                                    }}
                                                    labelFormatter={(
                                                        _,
                                                        payload,
                                                    ) =>
                                                        payload?.[0]?.payload
                                                            ?.employeeName ||
                                                        'Pracownik'
                                                    }
                                                />
                                                <Bar
                                                    yAxisId="hours"
                                                    dataKey="workHours"
                                                    name="Przepracowany czas"
                                                    fill="#008bb4"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    yAxisId="appointments"
                                                    dataKey="appointmentsCount"
                                                    name="Liczba wizyt"
                                                    fill="#6cbf84"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="salonbw-muted p-20">
                                        Brak aktywności pracowników dla
                                        wybranego dnia.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </SalonShell>
    );
}
