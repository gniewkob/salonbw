import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useDashboardStats, useEmployeeRanking } from '@/hooks/useStatistics';
import { DateRange } from '@/types';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

export default function StatisticsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <VersumShell role={role}>
            <StatisticsPageContent />
        </VersumShell>
    );
}

function StatisticsPageContent() {
    const [reportDate, setReportDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const { data: dashboard, isLoading: dashboardLoading } =
        useDashboardStats();
    const {
        data: employees = [],
        isLoading: employeesLoading,
        error: employeesError,
    } = useEmployeeRanking({
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

    const formatMoney = (value: number): string =>
        value.toFixed(2).replace('.', ',') + ' zł';

    const downloadCsvReport = () => {
        const escape = (value: unknown) =>
            `"${String(value ?? '').replaceAll('"', '""')}"`;

        const lines: string[][] = [];
        lines.push(['sep=;']);
        lines.push(['Raport finansowy']);
        lines.push(['Data', reportDate]);
        lines.push([]);
        lines.push(['Salon ogolem']);
        lines.push([
            'Sprzedaz uslug brutto',
            `${totals.dayRevenue.toFixed(2)}`,
        ]);
        lines.push(['Sprzedaz produktow brutto', '0.00']);
        lines.push([
            'Utarg za ten tydzien',
            `${totals.weekRevenue.toFixed(2)}`,
        ]);
        lines.push([
            'Utarg za ten miesiac',
            `${totals.totalRevenue.toFixed(2)}`,
        ]);
        lines.push(['Laczna liczba wizyt', `${totals.totalVisits}`]);
        lines.push([
            'Srednia wartosc wizyty',
            `${totals.avgVisitValue.toFixed(2)}`,
        ]);
        lines.push([]);
        lines.push(['Dane w podziale na pracownikow']);
        lines.push([
            'Pracownik',
            'Wizyty',
            'Sprzedaz uslug brutto',
            'Srednia wartosc wizyty',
            'Napiwki',
            'Ocena',
        ]);

        for (const employee of employees) {
            lines.push(
                [
                    employee.employeeName,
                    employee.completedAppointments,
                    employee.revenue.toFixed(2),
                    employee.averageRevenue.toFixed(2),
                    employee.tips.toFixed(2),
                    employee.rating.toFixed(1),
                ].map((v) => String(v)),
            );
        }

        const csv = lines
            .map((row) => row.map(escape).join(';'))
            .join('\n')
            .replaceAll('.', ',');

        // Excel on Windows often needs BOM to reliably detect UTF-8.
        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `raport-finansowy-${reportDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
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
                    onChange={(e) => setReportDate(e.target.value)}
                    aria-label="Data raportu"
                />
                <button
                    type="button"
                    className="btn btn-default versum-toolbar-btn"
                    onClick={downloadCsvReport}
                    disabled={dashboardLoading || employeesLoading}
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
                    <h2 className="nav-header mt-20 mb-10">SALON OGÓŁEM</h2>
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="versum-widget">
                                <div className="versum-widget__header">
                                    Podsumowanie finansowe
                                </div>
                                <table className="versum-table">
                                    <tbody>
                                        <tr>
                                            <td>Sprzedaż usług brutto</td>
                                            <td className="text-right">
                                                {formatMoney(totals.dayRevenue)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Sprzedaż produktów brutto</td>
                                            <td className="text-right">
                                                0,00 zł
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Utarg za ten tydzień</td>
                                            <td className="text-right">
                                                {formatMoney(
                                                    totals.weekRevenue,
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Utarg za ten miesiąc</td>
                                            <td className="text-right">
                                                {formatMoney(
                                                    totals.totalRevenue,
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Łączna liczba wizyt</td>
                                            <td className="text-right">
                                                {totals.totalVisits}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Średnia wartość wizyty</td>
                                            <td className="text-right">
                                                {formatMoney(
                                                    totals.avgVisitValue,
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="versum-widget">
                                <div className="versum-widget__header">
                                    Szybkie podsumowanie
                                </div>
                                <div className="versum-widget__content">
                                    <div className="row">
                                        <div className="col-xs-6 mb-10">
                                            <div className="versum-tile">
                                                <div className="versum-tile__label">
                                                    Metody płatności
                                                </div>
                                                <div className="versum-tile__value text-success">
                                                    gotówka 100%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xs-6 mb-10">
                                            <div className="versum-tile">
                                                <div className="versum-tile__label">
                                                    Wizyty zakończone
                                                </div>
                                                <div className="versum-tile__value text-accent">
                                                    {totals.totalVisits}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="nav-header mt-20 mb-10">
                        DANE W PODZIALE NA PRACOWNIKÓW
                    </div>
                    {employeesLoading ? (
                        <div className="p-3 text-sm versum-muted">
                            Ładowanie pracowników...
                        </div>
                    ) : employeesError ? (
                        <div className="p-3 text-sm versum-muted">
                            Nie udało się pobrać danych pracowników.
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
                                                    {employee.employeeName}
                                                </a>
                                            </td>
                                            <td>
                                                {employee.completedAppointments}
                                            </td>
                                            <td>
                                                {employee.revenue.toFixed(2)} zł
                                            </td>
                                            <td>
                                                {employee.averageRevenue.toFixed(
                                                    2,
                                                )}{' '}
                                                zł
                                            </td>
                                            <td>
                                                {employee.tips.toFixed(2)} zł
                                            </td>
                                            <td>
                                                {employee.rating.toFixed(1)}
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
    );
}
