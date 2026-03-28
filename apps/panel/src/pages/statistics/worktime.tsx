import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface WorkTimeReport {
    employeeId: number;
    employeeName: string;
    totalWorkTimeMinutes: number;
    totalAppointments: number;
    workingDays: number;
    averageWorkTimePerDay: number;
    byDay: Array<{
        date: string;
        workTimeMinutes: number;
        appointmentsCount: number;
    }>;
}

const DATE_RANGES = [
    { id: 'this_week', label: 'Ten tydzień' },
    { id: 'last_week', label: 'Poprzedni tydzień' },
    { id: 'this_month', label: 'Ten miesiąc' },
    { id: 'last_month', label: 'Poprzedni miesiąc' },
];

const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

export default function WorkTimeReportPage() {
    const { role, apiFetch } = useAuth();
    const [dateRange, setDateRange] = useState('this_week');
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(
        null,
    );
    const [data, setData] = useState<WorkTimeReport[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        void fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await apiFetch<WorkTimeReport[]>(
                `/statistics/worktime?range=${dateRange}`,
            );
            setData(result);
            if (result.length > 0 && !selectedEmployee) {
                setSelectedEmployee(result[0].employeeId);
            }
        } catch (error) {
            console.error('Failed to fetch work time report:', error);
        }
        setIsLoading(false);
    };

    if (!role) return null;

    const selectedData = data.find((d) => d.employeeId === selectedEmployee);

    const chartData =
        selectedData?.byDay.map((d) => ({
            date: d.date,
            workTime: Math.round((d.workTimeMinutes / 60) * 100) / 100,
            appointments: d.appointmentsCount,
        })) || [];

    const totalStats = data.reduce(
        (acc, emp) => ({
            workTime: acc.workTime + emp.totalWorkTimeMinutes,
            appointments: acc.appointments + emp.totalAppointments,
            days: acc.days + emp.workingDays,
        }),
        { workTime: 0, appointments: 0, days: 0 },
    );

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonShell role={role}>
                <div className="statistics-page">
                    {/* Header */}
                    <div className="flex-between mb-5">
                        <h1 className="fs-3 fw-semibold">Raport czasu pracy</h1>
                        <select
                            title="Okres statystyk"
                            aria-label="Wybierz okres"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="form-control"
                        >
                            {DATE_RANGES.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-40">Ładowanie...</div>
                    ) : (
                        <>
                            {/* Total Stats */}
                            <div className="row mb-5">
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Pracowników
                                        </div>
                                        <div className="salonbw-tile__value">
                                            {data.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Suma godzin
                                        </div>
                                        <div className="salonbw-tile__value text-accent">
                                            {formatMinutes(totalStats.workTime)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Wizyt
                                        </div>
                                        <div className="salonbw-tile__value text-success">
                                            {totalStats.appointments}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Dni roboczych
                                        </div>
                                        <div className="salonbw-tile__value">
                                            {totalStats.days}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employee Selector & Chart */}
                            <div className="row">
                                <div className="col-sm-4">
                                    <div className="salonbw-widget">
                                        <div className="salonbw-widget__header">
                                            Pracownicy
                                        </div>
                                        <div className="salonbw-widget__content p-0">
                                            <table className="salonbw-table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Pracownik</th>
                                                        <th className="text-end">
                                                            Godziny
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.map((emp) => {
                                                        return (
                                                            <tr
                                                                key={
                                                                    emp.employeeId
                                                                }
                                                                className={` ${selectedEmployee === emp.employeeId ? 'active' : ''}`}
                                                                onClick={() =>
                                                                    setSelectedEmployee(
                                                                        emp.employeeId,
                                                                    )
                                                                }
                                                            >
                                                                <td>
                                                                    {
                                                                        emp.employeeName
                                                                    }
                                                                </td>
                                                                <td className="text-end">
                                                                    {formatMinutes(
                                                                        emp.totalWorkTimeMinutes,
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-8">
                                    {selectedData && (
                                        <>
                                            <div className="salonbw-widget mb-5">
                                                <div className="salonbw-widget__header">
                                                    {selectedData.employeeName}{' '}
                                                    - szczegóły
                                                </div>
                                                <div className="salonbw-widget__content">
                                                    <div className="row">
                                                        <div className="col-sm-3">
                                                            <div className="text-center">
                                                                <div className="fs-3 fw-bold text-accent">
                                                                    {formatMinutes(
                                                                        selectedData.totalWorkTimeMinutes,
                                                                    )}
                                                                </div>
                                                                <div className="small text-muted">
                                                                    Suma godzin
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-3">
                                                            <div className="text-center">
                                                                <div className="fs-3 fw-bold text-success">
                                                                    {
                                                                        selectedData.totalAppointments
                                                                    }
                                                                </div>
                                                                <div className="small text-muted">
                                                                    Wizyt
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-3">
                                                            <div className="text-center">
                                                                <div className="fs-3 fw-bold">
                                                                    {
                                                                        selectedData.workingDays
                                                                    }
                                                                </div>
                                                                <div className="small text-muted">
                                                                    Dni
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-3">
                                                            <div className="text-center">
                                                                <div className="fs-3 fw-bold">
                                                                    {formatMinutes(
                                                                        selectedData.averageWorkTimePerDay,
                                                                    )}
                                                                </div>
                                                                <div className="small text-muted">
                                                                    Średnio/dzień
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="salonbw-widget">
                                                <div className="salonbw-widget__header">
                                                    Godziny pracy dzień po dniu
                                                </div>
                                                <div className="salonbw-widget__content h-[300px]">
                                                    <ResponsiveContainer>
                                                        <BarChart
                                                            data={chartData}
                                                            margin={{
                                                                top: 20,
                                                                right: 30,
                                                                left: 20,
                                                                bottom: 5,
                                                            }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis
                                                                dataKey="date"
                                                                tickFormatter={(
                                                                    value,
                                                                ) => {
                                                                    const date =
                                                                        new Date(
                                                                            value,
                                                                        );
                                                                    return `${date.getDate()}.${date.getMonth() + 1}`;
                                                                }}
                                                            />
                                                            <YAxis />
                                                            <Tooltip
                                                                formatter={(
                                                                    value?: number,
                                                                    name?: string,
                                                                ) => {
                                                                    if (
                                                                        name ===
                                                                        'workTime'
                                                                    ) {
                                                                        return `${value ?? 0}h`;
                                                                    }
                                                                    return `${value ?? 0} wizyt`;
                                                                }}
                                                            />
                                                            <Bar
                                                                dataKey="workTime"
                                                                name="Godziny"
                                                                fill="#008bb4"
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Summary Table */}
                            <div className="salonbw-widget mt-20">
                                <div className="salonbw-widget__header">
                                    Podsumowanie wszystkich pracowników
                                </div>
                                <div className="salonbw-widget__content">
                                    <table className="salonbw-table">
                                        <thead>
                                            <tr>
                                                <th>Pracownik</th>
                                                <th className="text-end">
                                                    Godziny
                                                </th>
                                                <th className="text-end">
                                                    Wizyty
                                                </th>
                                                <th className="text-end">
                                                    Dni
                                                </th>
                                                <th className="text-end">
                                                    Średnio/dzień
                                                </th>
                                                <th className="text-end">
                                                    Wizyt/godzinę
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((emp) => {
                                                const hours =
                                                    emp.totalWorkTimeMinutes /
                                                    60;
                                                const appsPerHour =
                                                    hours > 0
                                                        ? (
                                                              emp.totalAppointments /
                                                              hours
                                                          ).toFixed(1)
                                                        : '0';
                                                return (
                                                    <tr key={emp.employeeId}>
                                                        <td>
                                                            {emp.employeeName}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatMinutes(
                                                                emp.totalWorkTimeMinutes,
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            {
                                                                emp.totalAppointments
                                                            }
                                                        </td>
                                                        <td className="text-end">
                                                            {emp.workingDays}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatMinutes(
                                                                emp.averageWorkTimePerDay,
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            {appsPerHour}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
