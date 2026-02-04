import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useDashboardStats, useEmployeeRanking } from '@/hooks/useStatistics';
import { DateRange } from '@/types';

export default function StatisticsPage() {
    return <StatisticsPageContent />;
}

function StatisticsPageContent() {
    const [reportDate, setReportDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const { data: dashboard, loading: dashboardLoading } = useDashboardStats();
    const { data: employees, loading: employeesLoading } = useEmployeeRanking({
        range: DateRange.ThisMonth,
    });

    const totals = useMemo(() => {
        const totalRevenue = dashboard?.monthRevenue ?? 0;
        const dayRevenue = dashboard?.todayRevenue ?? 0;
        const weekRevenue = dashboard?.weekRevenue ?? 0;
        return {
            totalRevenue,
            dayRevenue,
            weekRevenue,
            totalVisits: dashboard?.monthAppointments ?? 0,
            avgVisitValue:
                (dashboard?.monthAppointments ?? 0) > 0
                    ? totalRevenue / (dashboard?.monthAppointments ?? 1)
                    : 0,
        };
    }, [dashboard]);

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <DashboardLayout>
                <div className="versum-page" data-testid="statistics-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">
                            Statystyki / Raport finansowy
                        </h1>
                    </header>

                    <div className="versum-page__toolbar">
                        <input
                            className="versum-input"
                            type="date"
                            value={reportDate}
                            onChange={(event) =>
                                setReportDate(event.target.value)
                            }
                            aria-label="Data raportu"
                        />
                        <button
                            type="button"
                            className="versum-button versum-button--light"
                        >
                            pobierz raport Excel
                        </button>
                    </div>

                    {dashboardLoading ? (
                        <div className="p-4 text-sm versum-muted">
                            Ładowanie raportu...
                        </div>
                    ) : (
                        <div className="p-4">
                            <h2 className="mb-3 text-xl text-gray-700">
                                Salon ogółem
                            </h2>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
                                <div className="border border-gray-300 bg-white p-3">
                                    <table className="versum-table">
                                        <tbody>
                                            <tr>
                                                <td>Sprzedaż usług brutto</td>
                                                <td>
                                                    {totals.dayRevenue.toFixed(
                                                        2,
                                                    )}{' '}
                                                    zł
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    Sprzedaż produktów brutto
                                                </td>
                                                <td>0,00 zł</td>
                                            </tr>
                                            <tr>
                                                <td>Utarg za ten tydzień</td>
                                                <td>
                                                    {totals.weekRevenue.toFixed(
                                                        2,
                                                    )}{' '}
                                                    zł
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Utarg za ten miesiąc</td>
                                                <td>
                                                    {totals.totalRevenue.toFixed(
                                                        2,
                                                    )}{' '}
                                                    zł
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Łączna liczba wizyt</td>
                                                <td>{totals.totalVisits}</td>
                                            </tr>
                                            <tr>
                                                <td>Średnia wartość wizyty</td>
                                                <td>
                                                    {totals.avgVisitValue.toFixed(
                                                        2,
                                                    )}{' '}
                                                    zł
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border border-gray-300 bg-white p-3">
                                        <h3 className="mb-2 text-sm font-semibold text-gray-700">
                                            Udział metod płatności
                                        </h3>
                                        <div className="mx-auto h-44 w-44 rounded-full bg-[#86be3f]" />
                                        <p className="mt-2 text-xs text-gray-600">
                                            gotówka:{' '}
                                            {totals.totalRevenue.toFixed(2)} zł
                                            (100%)
                                        </p>
                                    </div>
                                    <div className="border border-gray-300 bg-white p-3">
                                        <h3 className="mb-2 text-sm font-semibold text-gray-700">
                                            Udział pracowników w utargu
                                        </h3>
                                        <div className="mx-auto h-44 w-44 rounded-full bg-[#c95334]" />
                                        <p className="mt-2 text-xs text-gray-600">
                                            na podstawie wizyt zakończonych
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h2 className="mb-3 mt-6 text-xl text-gray-700">
                                Dane w podziale na pracowników
                            </h2>
                            {employeesLoading ? (
                                <div className="p-3 text-sm versum-muted">
                                    Ładowanie pracowników...
                                </div>
                            ) : (
                                <div className="versum-table-wrap border border-gray-300">
                                    <table className="versum-table">
                                        <thead>
                                            <tr>
                                                <th>Pracownik</th>
                                                <th>Wizyty</th>
                                                <th>Sprzedaż usług brutto</th>
                                                <th>Średnia wartość wizyty</th>
                                                <th>Napiwki</th>
                                                <th>Ocena</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map((employee) => (
                                                <tr key={employee.employeeId}>
                                                    <td>
                                                        {employee.employeeName}
                                                    </td>
                                                    <td>
                                                        {
                                                            employee.completedAppointments
                                                        }
                                                    </td>
                                                    <td>
                                                        {employee.revenue.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł
                                                    </td>
                                                    <td>
                                                        {employee.averageRevenue.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł
                                                    </td>
                                                    <td>
                                                        {employee.tips.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł
                                                    </td>
                                                    <td>
                                                        {employee.rating.toFixed(
                                                            1,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
