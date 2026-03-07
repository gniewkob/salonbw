import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useDashboardStats, useEmployeeRanking } from '@/hooks/useStatistics';
import { useCashRegister } from '@/hooks/useStatistics';
import { useEmployees } from '@/hooks/useEmployees';
import { DateRange } from '@/types';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import StatisticsPieChart from '@/components/statistics/StatisticsPieChart';

const VISUAL_FALLBACK_EMPLOYEES = [
    { id: -1, name: 'Recepcja' },
    { id: -2, name: 'Gniewko Bodora' },
    { id: -3, name: 'Aleksandra Bodora' },
];

const EMPLOYEE_COLORS = ['#88ca2a', '#169ddd', '#d95431'];

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    const raw = String(value ?? '').trim();
    if (!raw) return 0;

    const normalized = raw.replace(',', '.');
    const repeatedMoney = normalized.match(/-?\d+\.\d{2}/g);
    if (repeatedMoney && repeatedMoney.length > 1) {
        const sum = repeatedMoney.reduce((acc, token) => {
            const n = Number(token);
            return acc + (Number.isFinite(n) ? n : 0);
        }, 0);
        return Number.isFinite(sum) ? sum : 0;
    }

    const parsed =
        Number(normalized.replace(/[^0-9.-]/g, '')) ||
        Number((normalized.match(/-?\d+(?:\.\d+)?/) || ['0'])[0]);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatDuration = (minutes: number): string => {
    const safeMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} h`;
    return `${hours} h ${mins} min`;
};

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
    const { data: registerSummary } = useCashRegister(reportDate);
    const safeEmployeeList = useMemo(() => employeeList ?? [], [employeeList]);

    const totals = useMemo(() => {
        const totalRevenue = toNumber(dashboard?.monthRevenue);
        const dayRevenue = toNumber(dashboard?.todayRevenue);
        const weekRevenue = toNumber(dashboard?.weekRevenue);
        const totalVisits = toNumber(dashboard?.monthAppointments);
        return {
            totalRevenue,
            dayRevenue,
            weekRevenue,
            totalVisits,
            avgVisitValue: totalVisits > 0 ? totalRevenue / totalVisits : 0,
        };
    }, [dashboard]);

    const employeeRows = useMemo(() => {
        if (ranking.length > 0) {
            return ranking.map((employee) => ({
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                completedAppointments: toNumber(employee.completedAppointments),
                revenue: toNumber(employee.revenue),
                averageRevenue: toNumber(employee.averageRevenue),
                averageDuration: toNumber(employee.averageDuration),
                tips: toNumber(employee.tips),
                rating: toNumber(employee.rating),
            }));
        }

        if (!safeEmployeeList.length) {
            return VISUAL_FALLBACK_EMPLOYEES.map((employee) => ({
                employeeId: employee.id,
                employeeName: employee.name,
                completedAppointments: 0,
                revenue: 0,
                averageRevenue: 0,
                averageDuration: 0,
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
                averageDuration: 0,
                tips: 0,
                rating: 0,
            };
        });
    }, [ranking, safeEmployeeList]);

    const totalWorkMinutes = useMemo(() => {
        return employeeRows.reduce((acc, employee) => {
            return (
                acc +
                toNumber(employee.completedAppointments) *
                    toNumber(employee.averageDuration)
            );
        }, 0);
    }, [employeeRows]);

    const paymentRows = useMemo(() => {
        const totalsData = registerSummary?.totals;
        const candidates = [
            { key: 'cash', label: 'gotówka', color: '#88ca2a' },
            { key: 'card', label: 'karta kredytowa', color: '#169ddd' },
            { key: 'transfer', label: 'przelew', color: '#f0ad4e' },
            { key: 'online', label: 'online', color: '#8e44ad' },
            { key: 'voucher', label: 'voucher', color: '#7f8c8d' },
        ] as const;

        const rows = candidates
            .map((item) => ({
                ...item,
                amount: toNumber(totalsData?.[item.key]),
            }))
            .filter((item) => item.amount > 0);

        if (!rows.length) {
            return [
                {
                    key: 'cash' as const,
                    label: 'gotówka',
                    color: '#88ca2a',
                    amount:
                        toNumber(totalsData?.total) ||
                        toNumber(totalsData?.cash),
                },
            ];
        }
        return rows;
    }, [registerSummary]);

    const paymentTotal = useMemo(() => {
        return paymentRows.reduce((acc, item) => acc + item.amount, 0);
    }, [paymentRows]);

    const employeeChartData = useMemo(() => {
        return employeeRows.slice(0, 3).map((emp, i) => ({
            label: emp.employeeName,
            value: toNumber(emp.revenue),
            color: EMPLOYEE_COLORS[i] ?? '#ccc',
            percent:
                totals.totalRevenue > 0
                    ? Math.round(
                          (toNumber(emp.revenue) / totals.totalRevenue) * 100,
                      )
                    : 0,
        }));
    }, [employeeRows, totals.totalRevenue]);

    const formatMoney = (value: unknown): string =>
        toNumber(value).toFixed(2).replace('.', ',') + ' zł';

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
            `${toNumber(totals.dayRevenue).toFixed(2)}`,
        ]);
        lines.push(['Sprzedaz produktow brutto', '0.00']);
        lines.push([
            'Utarg za ten tydzien',
            `${toNumber(totals.weekRevenue).toFixed(2)}`,
        ]);
        lines.push([
            'Utarg za ten miesiac',
            `${toNumber(totals.totalRevenue).toFixed(2)}`,
        ]);
        lines.push(['Laczna liczba wizyt', `${totals.totalVisits}`]);
        lines.push([
            'Srednia wartosc wizyty',
            `${toNumber(totals.avgVisitValue).toFixed(2)}`,
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
                    toNumber(employee.revenue).toFixed(2),
                    (toNumber(employee.revenue) * 0.77).toFixed(2),
                    '0.00',
                    '0.00',
                    toNumber(employee.revenue).toFixed(2),
                    totals.totalRevenue > 0
                        ? (
                              (toNumber(employee.revenue) /
                                  toNumber(totals.totalRevenue)) *
                              100
                          ).toFixed(0) + '%'
                        : '0%',
                    toNumber(employee.tips).toFixed(2),
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
            <ul className="breadcrumb">
                <li>Statystyki</li>
                <li>Raport finansowy</li>
            </ul>

            {/* Toolbar — matches Versum .actions structure */}
            <div className="statistics-actions">
                <div className="statistics-date-wrap">
                    <a
                        className="statistics-nav-btn"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Poprzedni dzień"
                    >
                        <span className="statistics-arrow">&#8249;</span>
                    </a>
                    <input
                        id="report-date"
                        className="statistics-date-input"
                        type="text"
                        readOnly
                        value={reportDate}
                        aria-label="Data raportu"
                    />
                    <label
                        htmlFor="report-date-picker"
                        className="statistics-nav-btn statistics-cal-btn"
                        aria-label="Wybierz datę"
                    >
                        <span
                            className="statistics-cal-icon"
                            aria-hidden="true"
                        />
                        <input
                            id="report-date-picker"
                            type="date"
                            className="statistics-date-picker-hidden"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                        />
                    </label>
                    <a
                        className="statistics-nav-btn"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Następny dzień"
                    >
                        <span className="statistics-arrow">&#8250;</span>
                    </a>
                </div>
                <button
                    type="button"
                    className="btn btn-default btn-versum-blue statistics-excel-btn"
                    onClick={downloadCsvReport}
                    disabled={dashboardLoading || rankingLoading}
                >
                    <span
                        className="statistics-icon-excel"
                        aria-hidden="true"
                    />
                    pobierz raport Excel
                </button>
                <button
                    type="button"
                    className="btn btn-default statistics-print-btn"
                    onClick={() => window.print()}
                    aria-label="Drukuj"
                >
                    <span
                        className="statistics-icon-print"
                        aria-hidden="true"
                    />
                </button>
            </div>

            {dashboardLoading ? (
                <div className="versum-muted p-20">Ładowanie raportu...</div>
            ) : (
                <div className="statistics-description">
                    <h2>Salon ogółem</h2>
                    <p>
                        Liczba sfinalizowanych wizyt:{' '}
                        <strong>{totals.totalVisits}</strong>
                        <br />
                        Łączny czas trwania sfinalizowanych wizyt:{' '}
                        <strong>{formatDuration(totalWorkMinutes)}</strong>
                    </p>
                    <br />

                    {/* Bootstrap-style float grid — col-lg-5 + col-lg-7 */}
                    <div className="statistics-row">
                        <div className="statistics-col-5">
                            <div className="statistics-price-summary">
                                <div className="statistics-data-table">
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td className="statistics-td-empty" />
                                                <th>netto</th>
                                                <th>brutto</th>
                                            </tr>
                                            <tr>
                                                <th>Sprzedaż usług</th>
                                                <td>0,00&nbsp;zł</td>
                                                <td>
                                                    {formatMoney(
                                                        totals.dayRevenue,
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Sprzedaż towarów</th>
                                                <td>0,00&nbsp;zł</td>
                                                <td>0,00&nbsp;zł</td>
                                            </tr>
                                            <tr>
                                                <td
                                                    className="statistics-td-summary"
                                                    colSpan={3}
                                                >
                                                    Utarg ze sprzedaży usług i
                                                    towarów brutto:{' '}
                                                    <strong>
                                                        {formatMoney(
                                                            totals.dayRevenue,
                                                        )}
                                                        <br />
                                                    </strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Napiwki</th>
                                                <td className="statistics-td-no-right" />
                                                <td className="statistics-td-no-left">
                                                    0,00&nbsp;zł
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <br />
                                Saldo gotówki w kasie:{' '}
                                <strong>
                                    {formatMoney(
                                        toNumber(registerSummary?.totals?.cash),
                                    )}
                                </strong>
                                <br />
                                Wpływy: {formatMoney(paymentTotal)}
                                <br />
                                Wydatki: {formatMoney(0)}
                                <br />
                                <br />
                                Metody płatności niewliczone do utargu{' '}
                                <small>brutto</small>:{' '}
                                <strong>0,00&nbsp;zł</strong>
                                <br />
                                Sprzedaż usług <small>brutto</small>: 0,00&nbsp;
                                zł
                                <br />
                                Sprzedaż towarów <small>brutto</small>: 0,00
                                &nbsp;zł
                                <br />
                            </div>
                        </div>
                        <div className="statistics-col-7">
                            <div className="statistics-chart-wrap">
                                <div className="statistics-chart-title">
                                    Udział metod płatności w utargu
                                    <span
                                        className="statistics-info-tip"
                                        title="Wykres nie uwzględnia kwot zwrotów"
                                        aria-label="Informacja"
                                    />
                                </div>
                                <StatisticsPieChart
                                    width={500}
                                    height={300}
                                    data={paymentRows.map((r) => ({
                                        label: `${r.label}: ${formatMoney(r.amount)} (${paymentTotal > 0 ? ((r.amount / paymentTotal) * 100).toFixed(1) : '0,0'}%)`,
                                        value: r.amount,
                                        color: r.color,
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                    <br className="statistics-clearfix" />

                    <h2>Dane w podziale na pracowników</h2>
                    {rankingLoading ? (
                        <div className="versum-muted p-20">
                            Ładowanie pracowników...
                        </div>
                    ) : rankingError ? (
                        <div className="versum-muted p-20">
                            Nie udało się pobrać danych pracowników.
                        </div>
                    ) : (
                        <div className="statistics-employee-table-wrap">
                            <table className="statistics-table-bordered">
                                <tbody>
                                    <tr>
                                        <th>Pracownik</th>
                                        <th>Wizyty</th>
                                        <th>Łączny czas wizyt</th>
                                        <th>
                                            Sprzedaż usług <small>brutto</small>
                                        </th>
                                        <th>
                                            Sprzedaż usług <small>netto</small>
                                        </th>
                                        <th>
                                            Sprzedaż towarów{' '}
                                            <small>brutto</small>
                                        </th>
                                        <th>
                                            Sprzedaż towarów{' '}
                                            <small>netto</small>
                                        </th>
                                        <th>
                                            Utarg <small>brutto</small>
                                        </th>
                                        <th>Procent</th>
                                    </tr>
                                    {employeeRows.map((employee, i) => (
                                        <tr
                                            key={employee.employeeId}
                                            className={
                                                i % 2 === 0
                                                    ? 'statistics-row-even'
                                                    : 'statistics-row-odd'
                                            }
                                        >
                                            <td>{employee.employeeName}</td>
                                            <td>
                                                {employee.completedAppointments}
                                            </td>
                                            <td>
                                                {formatDuration(
                                                    toNumber(
                                                        employee.completedAppointments,
                                                    ) *
                                                        toNumber(
                                                            employee.averageDuration,
                                                        ),
                                                )}
                                            </td>
                                            <td>
                                                {toNumber(
                                                    employee.revenue,
                                                ).toFixed(2)}
                                                &nbsp;zł
                                            </td>
                                            <td>
                                                {(
                                                    toNumber(employee.revenue) *
                                                    0.77
                                                ).toFixed(2)}
                                                &nbsp;zł
                                            </td>
                                            <td>0,00&nbsp;zł</td>
                                            <td>0,00&nbsp;zł</td>
                                            <td>
                                                {toNumber(
                                                    employee.revenue,
                                                ).toFixed(2)}
                                                &nbsp;zł
                                            </td>
                                            <td>
                                                {totals.totalRevenue > 0
                                                    ? `${((toNumber(employee.revenue) / toNumber(totals.totalRevenue)) * 100).toFixed(0)}%`
                                                    : '0%'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="statistics-summary-header"
                                        >
                                            <strong>Podsumowanie</strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th />
                                        <th>Wizyty</th>
                                        <th>Łączny czas wizyt</th>
                                        <th>
                                            Sprzedaż usług <small>brutto</small>
                                        </th>
                                        <th>
                                            Sprzedaż usług <small>netto</small>
                                        </th>
                                        <th>
                                            Sprzedaż towarów{' '}
                                            <small>brutto</small>
                                        </th>
                                        <th>
                                            Sprzedaż towarów{' '}
                                            <small>netto</small>
                                        </th>
                                        <th>
                                            Utarg <small>brutto</small>
                                        </th>
                                        <th>Procent</th>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Łącznie</strong>
                                        </td>
                                        <td>{totals.totalVisits}</td>
                                        <td>
                                            {formatDuration(totalWorkMinutes)}
                                        </td>
                                        <td>
                                            {formatMoney(totals.totalRevenue)}
                                        </td>
                                        <td>
                                            {formatMoney(
                                                totals.totalRevenue * 0.77,
                                            )}
                                        </td>
                                        <td>0,00&nbsp;zł</td>
                                        <td>0,00&nbsp;zł</td>
                                        <td>
                                            {formatMoney(totals.totalRevenue)}
                                        </td>
                                        <td>100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="statistics-employee-chart-wrap">
                        <p className="statistics-chart-label">
                            Udział pracowników w utargu
                        </p>
                        <StatisticsPieChart
                            width={550}
                            height={320}
                            data={employeeChartData.map((e) => ({
                                label: `${e.label} (${e.percent}%)`,
                                value: e.value,
                                color: e.color,
                            }))}
                        />
                        <div className="statistics-wybrana">
                            Wybrana wartość:
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
