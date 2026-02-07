import { useState, useEffect } from 'react';
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

export default function EmployeeActivityPage() {
    const { role } = useAuth();
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
    const [data, setData] = useState<EmployeeActivitySummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/statistics/employees/activity?date=${selectedDate}`,
            );
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch employee activity:', error);
        }
        setLoading(false);
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate);
        const newDate =
            direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    const formatWorkTime = (minutes: number): string => {
        if (minutes === 0) return 'brak aktywności';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} min`;
        if (mins === 0) return `${hours} h`;
        return `${hours} h ${mins} min`;
    };

    if (!role) return null;

    return (
        <VersumShell role={role}>
            <div className="versum-page" data-testid="employee-activity-page">
                <header className="versum-page__header">
                    <h1 className="versum-page__title">
                        Statystyki / Aktywność pracowników
                    </h1>
                </header>

                <div className="versum-page__toolbar">
                    <div className="flex items-center gap-2">
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
                    <button
                        type="button"
                        className="versum-toolbar-btn btn btn-default"
                        onClick={() => window.print()}
                    >
                        🖨️
                    </button>
                </div>

                {loading ? (
                    <div className="p-4 text-sm versum-muted">Ładowanie...</div>
                ) : (
                    <div className="inner">
                        {/* Tabs */}
                        <div className="nav-tabs mb-4">
                            <button
                                type="button"
                                className={`${activeTab === 'table' ? 'active' : ''}`}
                                onClick={() => setActiveTab('table')}
                            >
                                Tabela
                            </button>
                            <button
                                type="button"
                                className={`${activeTab === 'chart' ? 'active' : ''}`}
                                onClick={() => setActiveTab('chart')}
                            >
                                Wykres
                            </button>
                        </div>

                        {activeTab === 'table' && data && (
                            <>
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
                                            {data.employees.map((employee) => (
                                                <tr key={employee.employeeId}>
                                                    <td>
                                                        <Link
                                                            href={`/employees/${employee.employeeId}`}
                                                            className="versum-link"
                                                        >
                                                            {
                                                                employee.employeeName
                                                            }
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        {formatWorkTime(
                                                            employee.workTimeMinutes,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {
                                                            employee.appointmentsCount
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100">
                                                <td
                                                    colSpan={3}
                                                    className="font-bold"
                                                >
                                                    Podsumowanie
                                                </td>
                                            </tr>
                                            <tr className="bg-gray-50">
                                                <th></th>
                                                <th>Przepracowany czas</th>
                                                <th>Liczba wizyt</th>
                                            </tr>
                                            <tr className="bg-gray-50 font-bold">
                                                <td>Łącznie</td>
                                                <td>
                                                    {formatWorkTime(
                                                        data.totals
                                                            .workTimeMinutes,
                                                    )}
                                                </td>
                                                <td>
                                                    {
                                                        data.totals
                                                            .appointmentsCount
                                                    }
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {activeTab === 'chart' && (
                            <div className="p-8 text-center text-gray-500">
                                <p>Wykres aktywności pracowników - wkrótce</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
