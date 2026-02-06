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
                            className="form-control versum-toolbar-search"
                            type="date"
                            value={reportDate}
                            onChange={(event) =>
                                setReportDate(event.target.value)
                            }
                            aria-label="Data raportu"
                        />
                        <button
                            type="button"
                            className="btn btn-default versum-toolbar-btn"
                        >
                            pobierz raport Excel
                        </button>
                    </div>

                    {dashboardLoading ? (
                        <div className="p-4 text-sm versum-muted">
                            Ładowanie raportu...
                        </div>
                    ) : (
                        <div className="inner">
                            <h2
                                className="nav-header"
                                style={{ margin: '20px 0 10px' }}
                            >
                                SALON OGÓŁEM
                            </h2>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="versum-widget">
                                        <div className="versum-widget__header">
                                            Podsumowanie finansowe
                                        </div>
                                        <table className="versum-table">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        Sprzedaż usług brutto
                                                    </td>
                                                    <td className="text-right">
                                                        {totals.dayRevenue.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        Sprzedaż produktów
                                                        brutto
                                                    </td>
                                                    <td className="text-right">
                                                        0,00 zł
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        Utarg za ten tydzień
                                                    </td>
                                                    <td className="text-right">
                                                        {totals.weekRevenue.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        Utarg za ten miesiąc
                                                    </td>
                                                    <td className="text-right">
                                                        {totals.totalRevenue.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Łączna liczba wizyt</td>
                                                    <td className="text-right">
                                                        {totals.totalVisits}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        Średnia wartość wizyty
                                                    </td>
                                                    <td className="text-right">
                                                        {totals.avgVisitValue.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="row">
                                        <div className="col-xs-6">
                                            <div className="versum-stat-tile">
                                                <div className="versum-stat-tile__title">
                                                    Metody płatności
                                                </div>
                                                <div className="text-center">
                                                    <div
                                                        className="color-circle"
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            margin: '0 auto 10px',
                                                            background:
                                                                '#86be3f',
                                                        }}
                                                    />
                                                    <div
                                                        className="versum-muted"
                                                        style={{
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        gotówka:{' '}
                                                        {totals.totalRevenue.toFixed(
                                                            2,
                                                        )}{' '}
                                                        zł (100%)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xs-6">
                                            <div className="versum-stat-tile">
                                                <div className="versum-stat-tile__title">
                                                    Wizyty
                                                </div>
                                                <div className="text-center">
                                                    <div
                                                        className="color-circle"
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            margin: '0 auto 10px',
                                                            background:
                                                                '#c95334',
                                                        }}
                                                    />
                                                    <p
                                                        className="versum-muted"
                                                        style={{
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        na podstawie wizyt
                                                        zakończonych
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="nav-header"
                                style={{
                                    marginTop: '20px',
                                    marginBottom: '10px',
                                }}
                            >
                                DANE W PODZIALE NA PRACOWNIKÓW
                            </div>
                            {employeesLoading ? (
                                <div className="p-3 text-sm versum-muted">
                                    Ładowanie pracowników...
                                </div>
                            ) : (
                                <div className="versum-table-wrap">
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
                                                        <a
                                                            href="javascript:;"
                                                            className="versum-link"
                                                        >
                                                            {
                                                                employee.employeeName
                                                            }
                                                        </a>
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
