import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useDashboardStats, useEmployeeRanking } from '@/hooks/useStatistics';
import { useEmployees } from '@/hooks/useEmployees';
import { DateRange } from '@/types';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

const VISUAL_FALLBACK_EMPLOYEES = [
    { id: -1, name: 'Recepcja' },
    { id: -2, name: 'Gniewko Bodora' },
    { id: -3, name: 'Aleksandra Bodora' },
];

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
        data: ranking = [],
        isLoading: rankingLoading,
        error: rankingError,
    } = useEmployeeRanking({
        range: DateRange.ThisMonth,
    });
    const { data: employeeList } = useEmployees();
    const safeEmployeeList = useMemo(() => employeeList ?? [], [employeeList]);

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

    const employeeRows = useMemo(() => {
        if (ranking.length > 0) {
            return ranking;
        }

        if (!safeEmployeeList.length) {
            return VISUAL_FALLBACK_EMPLOYEES.map((employee) => ({
                employeeId: employee.id,
                employeeName: employee.name,
                completedAppointments: 0,
                revenue: 0,
                averageRevenue: 0,
                tips: 0,
                rating: 0,
            }));
        }
        return safeEmployeeList.slice(0, 3).map((employee) => {
            return {
                employeeId: employee.id,
                employeeName:
                    employee.fullName ||
                    employee.name ||
                    [employee.firstName, employee.lastName]
                        .filter(Boolean)
                        .join(' ') ||
                    `Pracownik #${employee.id}`,
                completedAppointments: 0,
                revenue: 0,
                averageRevenue: 0,
                tips: 0,
                rating: 0,
            };
        });
    }, [ranking, safeEmployeeList]);

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
            'Laczny czas wizyt',
            'Sprzedaz uslug brutto',
            'Sprzedaz uslug netto',
            'Sprzedaz towarow brutto',
            'Sprzedaz towarow netto',
            'Utarg brutto',
            'Procent',
            'Napiwki',
        ]);

        for (const employee of employeeRows) {
            lines.push(
                [
                    employee.employeeName,
                    employee.completedAppointments,
                    '0 min',
                    employee.revenue.toFixed(2),
                    (employee.revenue * 0.77).toFixed(2),
                    '0.00',
                    '0.00',
                    employee.revenue.toFixed(2),
                    totals.totalRevenue > 0
                        ? (
                              (employee.revenue / totals.totalRevenue) *
                              100
                          ).toFixed(0) + '%'
                        : '0%',
                    employee.tips.toFixed(2),
                ].map((v) => String(v)),
            );
        }

        const csv = lines
            .map((row) => row.map(escape).join(';'))
            .join('\n')
            .replaceAll('.', ',');

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
        <div
            className="versum-page statistics-module"
            data-testid="statistics-page"
        >
            <header className="versum-page__header">
                <h1 className="versum-page__title">
                    Statystyki / Raport finansowy
                </h1>
            </header>

            <div className="versum-page__toolbar">
                <div className="btn-group mr-10" role="group">
                    <button type="button" className="btn btn-default" disabled>
                        ◀
                    </button>
                    <input
                        id="report-date"
                        className="form-control versum-toolbar-search"
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        aria-label="Data raportu"
                    />
                    <button type="button" className="btn btn-default" disabled>
                        ▶
                    </button>
                </div>
                <div style={{ marginLeft: 'auto' }} />
                <button
                    type="button"
                    className="btn btn-default mr-10"
                    onClick={downloadCsvReport}
                    disabled={dashboardLoading || rankingLoading}
                    style={{
                        borderColor: '#4ea4e0',
                        color: '#2f9ae0',
                        background: '#fff',
                    }}
                >
                    pobierz raport Excel
                </button>
                <button
                    type="button"
                    className="btn btn-default btn-xs"
                    aria-label="Drukuj"
                >
                    🖨
                </button>
            </div>

            {dashboardLoading ? (
                <div className="versum-muted p-20">Ładowanie raportu...</div>
            ) : (
                <div>
                    <h2 className="nav-header mt-20 mb-10">Salon ogółem</h2>
                    <div className="mb-10 fs-12">
                        Liczba sfinalizowanych wizyt: {totals.totalVisits}
                    </div>
                    <div className="mb-20 fs-12">
                        Łączny czas trwania sfinalizowanych wizyt: 0 min
                    </div>

                    <div className="statistics-summary-row mb-20">
                        <div className="statistics-summary-row__left">
                            <div className="versum-table-wrap">
                                <table className="versum-table fs-12">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>netto</th>
                                            <th>brutto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Sprzedaż usług</td>
                                            <td>0,00 zł</td>
                                            <td>
                                                {formatMoney(totals.dayRevenue)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Sprzedaż towarów</td>
                                            <td>0,00 zł</td>
                                            <td>0,00 zł</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3}>
                                                Utarg ze sprzedaży usług i
                                                towarów brutto:{' '}
                                                {formatMoney(totals.dayRevenue)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Napiwki</td>
                                            <td></td>
                                            <td>{formatMoney(0)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-10 fs-12">
                                <div>
                                    Saldo gotówki w kasie:{' '}
                                    {formatMoney(totals.dayRevenue)}
                                </div>
                                <div>
                                    Wpływy: {formatMoney(totals.dayRevenue)}
                                </div>
                                <div>Wydatki: {formatMoney(0)}</div>
                            </div>
                        </div>
                        <div className="statistics-summary-row__right">
                            <div className="versum-table-wrap">
                                <table className="versum-table fs-12">
                                    <tbody>
                                        <tr>
                                            <td
                                                style={{
                                                    verticalAlign: 'top',
                                                    width: '100%',
                                                }}
                                            >
                                                <strong>
                                                    Udział metod płatności w
                                                    utargu
                                                </strong>
                                                <div
                                                    className="mt-10"
                                                    style={{
                                                        border: '1px solid #d9dee2',
                                                        padding: 14,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'space-between',
                                                            gap: 20,
                                                        }}
                                                    >
                                                        <div
                                                            aria-hidden
                                                            style={{
                                                                width: 240,
                                                                height: 240,
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    '#86c92a',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <div className="fs-12">
                                                            <span
                                                                style={{
                                                                    display:
                                                                        'inline-block',
                                                                    width: 8,
                                                                    height: 8,
                                                                    background:
                                                                        '#86c92a',
                                                                    marginRight: 6,
                                                                }}
                                                            />
                                                            gotówka: 0,00 zł
                                                            (100%)
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 fs-12">
                        Metody płatności niewliczone do utargu brutto:{' '}
                        <strong>0,00 zł</strong>
                    </div>
                    <div className="mb-20 fs-12">
                        Sprzedaż usług brutto: 0,00 zł
                        <br />
                        Sprzedaż towarów brutto: 0,00 zł
                    </div>

                    <div className="nav-header mt-20 mb-10">
                        Dane w podziale na pracowników
                    </div>
                    {rankingLoading ? (
                        <div className="versum-muted p-20">
                            Ładowanie pracowników...
                        </div>
                    ) : rankingError ? (
                        <div className="versum-muted p-20">
                            Nie udało się pobrać danych pracowników.
                        </div>
                    ) : (
                        <div className="versum-table-wrap">
                            <table className="versum-table fs-12">
                                <thead>
                                    <tr>
                                        <th>Pracownik</th>
                                        <th>Wizyty</th>
                                        <th>Łączny czas wizyty</th>
                                        <th>Sprzedaż usług brutto</th>
                                        <th>Sprzedaż usług netto</th>
                                        <th>Sprzedaż towarów brutto</th>
                                        <th>Sprzedaż towarów netto</th>
                                        <th>Utarg brutto</th>
                                        <th>Procent</th>
                                        <th>Napiwki</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeRows.map((employee) => (
                                        <tr key={employee.employeeId}>
                                            <td>{employee.employeeName}</td>
                                            <td>
                                                {employee.completedAppointments}
                                            </td>
                                            <td>0 min</td>
                                            <td>
                                                {employee.revenue.toFixed(2)} zł
                                            </td>
                                            <td>
                                                {(
                                                    employee.revenue * 0.77
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>0,00 zł</td>
                                            <td>0,00 zł</td>
                                            <td>
                                                {employee.revenue.toFixed(2)} zł
                                            </td>
                                            <td>
                                                {totals.totalRevenue > 0
                                                    ? `${((employee.revenue / totals.totalRevenue) * 100).toFixed(0)}%`
                                                    : '0%'}
                                            </td>
                                            <td>
                                                {employee.tips.toFixed(2)} zł
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th>Łącznie</th>
                                        <th>{totals.totalVisits}</th>
                                        <th>0 min</th>
                                        <th>
                                            {formatMoney(totals.totalRevenue)}
                                        </th>
                                        <th>
                                            {formatMoney(
                                                totals.totalRevenue * 0.77,
                                            )}
                                        </th>
                                        <th>0,00 zł</th>
                                        <th>0,00 zł</th>
                                        <th>
                                            {formatMoney(totals.totalRevenue)}
                                        </th>
                                        <th>100%</th>
                                        <th>{formatMoney(0)}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    <div className="mt-20 mb-10 fs-12">
                        <strong>Udział pracowników w utargu</strong>
                    </div>
                    <div
                        style={{
                            border: '1px solid #d9dee2',
                            padding: 14,
                            width: 520,
                            maxWidth: '100%',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 20,
                            }}
                        >
                            <div
                                aria-hidden
                                style={{
                                    width: 220,
                                    height: 220,
                                    borderRadius: '50%',
                                    background:
                                        'conic-gradient(#2a9fd6 0 33%, #e0552f 33% 66%, #86c92a 66% 100%)',
                                    flexShrink: 0,
                                }}
                            />
                            <div className="fs-12">
                                {employeeRows.slice(0, 3).map((employee) => (
                                    <div key={employee.employeeId}>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: 8,
                                                height: 8,
                                                background:
                                                    employee.employeeId ===
                                                    employeeRows[0]?.employeeId
                                                        ? '#86c92a'
                                                        : employee.employeeId ===
                                                            employeeRows[1]
                                                                ?.employeeId
                                                          ? '#2a9fd6'
                                                          : '#e0552f',
                                                marginRight: 6,
                                            }}
                                        />
                                        {employee.employeeName} (0%)
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 fs-12">Wybrana wartość:</div>
                </div>
            )}
        </div>
    );
}
