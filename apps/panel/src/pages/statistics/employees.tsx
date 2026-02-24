import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import Link from 'next/link';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

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
        <VersumShell role={role}>
            <div
                className="versum-page statistics-module"
                data-testid="employee-activity-page"
            >
                <header className="versum-page__header">
                    <h1 className="versum-page__title">
                        Statystyki / Aktywność pracowników
                    </h1>
                </header>

                <div className="versum-page__toolbar">
                    <div className="btn-group mr-10" role="group">
                        <button
                            type="button"
                            className="versum-toolbar-btn btn btn-default"
                            onClick={() => navigateDate('prev')}
                        >
                            ◀
                        </button>
                        <input
                            type="date"
                            className="form-control versum-toolbar-search"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <button
                            type="button"
                            className="versum-toolbar-btn btn btn-default"
                            onClick={() => navigateDate('next')}
                        >
                            ▶
                        </button>
                    </div>
                    <div style={{ marginLeft: 'auto' }} />
                    <button
                        type="button"
                        className="btn btn-default btn-xs"
                        onClick={() => window.print()}
                    >
                        🖨
                    </button>
                </div>

                {loading ? (
                    <div className="versum-muted p-20">Ładowanie...</div>
                ) : (
                    <div>
                        <div>
                            <div
                                className="mb-20"
                                style={{
                                    display: 'inline-flex',
                                    borderBottom: '1px solid #cfd4da',
                                    width: '100%',
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-default mr-5"
                                >
                                    Tabela
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-default"
                                >
                                    Wykres
                                </button>
                            </div>
                            <div className="versum-table-wrap">
                                <table className="versum-table">
                                    <thead>
                                        <tr>
                                            <th>Pracownik</th>
                                            <th>Przepracowany czas</th>
                                            <th>Liczba wizyt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((employee) => (
                                            <tr key={employee.employeeId}>
                                                <td>
                                                    <Link
                                                        href={`/employees/${employee.employeeId}`}
                                                        className="versum-link"
                                                    >
                                                        {employee.employeeName}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {formatWorkTime(
                                                        toNumber(
                                                            employee.workTimeMinutes,
                                                        ),
                                                    )}
                                                </td>
                                                <td>
                                                    {toNumber(
                                                        employee.appointmentsCount,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <th
                                                colSpan={3}
                                                className="fs-28 fw-700"
                                            >
                                                Podsumowanie
                                            </th>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th>Łącznie</th>
                                            <th>
                                                {formatWorkTime(
                                                    totalWorkMinutes,
                                                )}
                                            </th>
                                            <th>{totalAppointments}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
