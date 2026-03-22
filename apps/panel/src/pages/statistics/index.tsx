import { useMemo, useState } from 'react';
import {
    addDays,
    endOfDay,
    endOfMonth,
    endOfWeek,
    format,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subDays,
} from 'date-fns';
import {
    useCashRegister,
    useCommissionReport,
    useEmployeeRanking,
    useRevenueChart,
} from '@/hooks/useStatistics';
import { useEmployees } from '@/hooks/useEmployees';
import { DateRange } from '@/types';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';
import StatisticsPieChart from '@/components/statistics/StatisticsPieChart';

const VISUAL_FALLBACK_EMPLOYEES = [
    { id: -1, name: 'Recepcja' },
    { id: -2, name: 'Gniewko Bodora' },
    { id: -3, name: 'Aleksandra Bodora' },
];

const EMPLOYEE_COLORS = ['#88ca2a', '#169ddd', '#d95431'];

interface EmployeeReportRow {
    employeeId: number;
    employeeName: string;
    completedAppointments: number;
    workTimeMinutes: number;
    serviceRevenue: number;
    productRevenue: number;
    totalRevenue: number;
    tips: number;
}

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
        <SalonBWShell role={role}>
            <StatisticsPageContent />
        </SalonBWShell>
    );
}

function StatisticsPageContent() {
    const [reportDate, setReportDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const reportDay = useMemo(
        () => new Date(`${reportDate}T12:00:00`),
        [reportDate],
    );
    const reportDayRange = useMemo(
        () => ({
            from: startOfDay(reportDay).toISOString(),
            to: endOfDay(reportDay).toISOString(),
        }),
        [reportDay],
    );
    const reportWeekRange = useMemo(
        () => ({
            from: startOfWeek(reportDay, { weekStartsOn: 1 }).toISOString(),
            to: endOfWeek(reportDay, { weekStartsOn: 1 }).toISOString(),
        }),
        [reportDay],
    );
    const reportMonthRange = useMemo(
        () => ({
            from: startOfMonth(reportDay).toISOString(),
            to: endOfMonth(reportDay).toISOString(),
        }),
        [reportDay],
    );

    const {
        data: ranking = [],
        isLoading: rankingLoading,
        error: rankingError,
    } = useEmployeeRanking({
        range: DateRange.Custom,
        from: reportDayRange.from,
        to: reportDayRange.to,
    });
    const {
        data: commissionSummary,
        isLoading: commissionLoading,
        error: commissionError,
    } = useCommissionReport({
        range: DateRange.Custom,
        from: reportDayRange.from,
        to: reportDayRange.to,
    });
    const {
        data: dayRevenuePoints = [],
        isLoading: dayRevenueLoading,
        error: dayRevenueError,
    } = useRevenueChart({
        range: DateRange.Custom,
        from: reportDayRange.from,
        to: reportDayRange.to,
        groupBy: 'day',
    });
    const {
        data: weekRevenuePoints = [],
        isLoading: weekRevenueLoading,
        error: weekRevenueError,
    } = useRevenueChart({
        range: DateRange.Custom,
        from: reportWeekRange.from,
        to: reportWeekRange.to,
        groupBy: 'day',
    });
    const {
        data: monthRevenuePoints = [],
        isLoading: monthRevenueLoading,
        error: monthRevenueError,
    } = useRevenueChart({
        range: DateRange.Custom,
        from: reportMonthRange.from,
        to: reportMonthRange.to,
        groupBy: 'day',
    });
    const { data: employeeList } = useEmployees();
    const { data: registerSummary } = useCashRegister(reportDate);
    const safeEmployeeList = useMemo(() => employeeList ?? [], [employeeList]);

    const employeeRows = useMemo<EmployeeReportRow[]>(() => {
        const rankingByEmployee = new Map(
            ranking.map((employee) => [
                employee.employeeId,
                {
                    completedAppointments: toNumber(
                        employee.completedAppointments,
                    ),
                    averageDuration: toNumber(employee.averageDuration),
                    tips: toNumber(employee.tips),
                    serviceRevenue: toNumber(employee.revenue),
                },
            ]),
        );

        const commissionByEmployee = new Map(
            (commissionSummary?.employees ?? []).map((employee) => [
                employee.employeeId,
                {
                    productRevenue: toNumber(employee.productRevenue),
                    totalRevenue: toNumber(employee.totalRevenue),
                },
            ]),
        );

        const namesByEmployee = new Map<number, string>();
        for (const employee of safeEmployeeList) {
            namesByEmployee.set(
                employee.id,
                employee.fullName ||
                    employee.name ||
                    [employee.firstName, employee.lastName]
                        .filter(Boolean)
                        .join(' ') ||
                    `Pracownik #${employee.id}`,
            );
        }
        for (const employee of ranking) {
            namesByEmployee.set(employee.employeeId, employee.employeeName);
        }
        for (const employee of commissionSummary?.employees ?? []) {
            namesByEmployee.set(employee.employeeId, employee.employeeName);
        }

        const employeeIds = new Set<number>([
            ...rankingByEmployee.keys(),
            ...commissionByEmployee.keys(),
            ...namesByEmployee.keys(),
        ]);

        if (employeeIds.size === 0) {
            return VISUAL_FALLBACK_EMPLOYEES.map((employee) => ({
                employeeId: employee.id,
                employeeName: employee.name,
                completedAppointments: 0,
                workTimeMinutes: 0,
                serviceRevenue: 0,
                productRevenue: 0,
                totalRevenue: 0,
                tips: 0,
            }));
        }

        const rows = Array.from(employeeIds)
            .map((employeeId) => {
                const rankingRow = rankingByEmployee.get(employeeId);
                const commissionRow = commissionByEmployee.get(employeeId);
                const completedAppointments =
                    rankingRow?.completedAppointments ?? 0;
                const workTimeMinutes =
                    completedAppointments * (rankingRow?.averageDuration ?? 0);
                const serviceRevenue = rankingRow?.serviceRevenue ?? 0;
                const productRevenue = commissionRow?.productRevenue ?? 0;
                const totalRevenue =
                    commissionRow?.totalRevenue ??
                    serviceRevenue + productRevenue;

                return {
                    employeeId,
                    employeeName:
                        namesByEmployee.get(employeeId) ??
                        `Pracownik #${employeeId}`,
                    completedAppointments,
                    workTimeMinutes,
                    serviceRevenue,
                    productRevenue,
                    totalRevenue,
                    tips: rankingRow?.tips ?? 0,
                };
            })
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        const allZero = rows.every(
            (employee) =>
                employee.completedAppointments === 0 &&
                employee.workTimeMinutes === 0 &&
                employee.serviceRevenue === 0 &&
                employee.productRevenue === 0 &&
                employee.totalRevenue === 0 &&
                employee.tips === 0,
        );

        if (allZero && rows.length < VISUAL_FALLBACK_EMPLOYEES.length) {
            return VISUAL_FALLBACK_EMPLOYEES.map((employee) => ({
                employeeId: employee.id,
                employeeName: employee.name,
                completedAppointments: 0,
                workTimeMinutes: 0,
                serviceRevenue: 0,
                productRevenue: 0,
                totalRevenue: 0,
                tips: 0,
            }));
        }

        return rows;
    }, [commissionSummary?.employees, ranking, safeEmployeeList]);

    const reportTotals = useMemo(() => {
        const sumRevenuePoints = (points: typeof dayRevenuePoints) =>
            points.reduce(
                (acc, point) => {
                    acc.serviceRevenue += toNumber(point.revenue);
                    acc.productRevenue += toNumber(point.products);
                    acc.tips += toNumber(point.tips);
                    return acc;
                },
                {
                    serviceRevenue: 0,
                    productRevenue: 0,
                    tips: 0,
                },
            );

        const day = sumRevenuePoints(dayRevenuePoints);
        const week = sumRevenuePoints(weekRevenuePoints);
        const month = sumRevenuePoints(monthRevenuePoints);
        const totalVisits = employeeRows.reduce(
            (sum, employee) => sum + employee.completedAppointments,
            0,
        );
        const totalWorkMinutes = employeeRows.reduce(
            (sum, employee) => sum + employee.workTimeMinutes,
            0,
        );
        const dayRevenue = day.serviceRevenue + day.productRevenue;

        return {
            dayServiceRevenue: day.serviceRevenue,
            dayProductRevenue: day.productRevenue,
            dayTips: day.tips,
            dayRevenue,
            weekRevenue: week.serviceRevenue + week.productRevenue,
            monthRevenue: month.serviceRevenue + month.productRevenue,
            totalVisits,
            totalWorkMinutes,
            avgVisitValue: totalVisits > 0 ? dayRevenue / totalVisits : 0,
        };
    }, [dayRevenuePoints, employeeRows, monthRevenuePoints, weekRevenuePoints]);

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

    const paymentTotal = useMemo(
        () => paymentRows.reduce((acc, item) => acc + item.amount, 0),
        [paymentRows],
    );

    const employeeChartData = useMemo(() => {
        return employeeRows.slice(0, 3).map((employee, index) => ({
            label: employee.employeeName,
            value: employee.totalRevenue,
            color: EMPLOYEE_COLORS[index] ?? '#ccc',
            percent:
                reportTotals.dayRevenue > 0
                    ? Math.round(
                          (employee.totalRevenue / reportTotals.dayRevenue) *
                              100,
                      )
                    : 0,
        }));
    }, [employeeRows, reportTotals.dayRevenue]);

    const formatMoney = (value: unknown): string =>
        `${toNumber(value).toFixed(2).replace('.', ',')} zł`;

    const navigateDate = (direction: 'prev' | 'next') => {
        const nextDate =
            direction === 'prev'
                ? subDays(reportDay, 1)
                : addDays(reportDay, 1);
        setReportDate(format(nextDate, 'yyyy-MM-dd'));
    };

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
            `${reportTotals.dayServiceRevenue.toFixed(2)}`,
        ]);
        lines.push([
            'Sprzedaz produktow brutto',
            `${reportTotals.dayProductRevenue.toFixed(2)}`,
        ]);
        lines.push(['Napiwki', `${reportTotals.dayTips.toFixed(2)}`]);
        lines.push([
            'Utarg za ten tydzien',
            `${reportTotals.weekRevenue.toFixed(2)}`,
        ]);
        lines.push([
            'Utarg za ten miesiac',
            `${reportTotals.monthRevenue.toFixed(2)}`,
        ]);
        lines.push(['Laczna liczba wizyt', `${reportTotals.totalVisits}`]);
        lines.push([
            'Srednia wartosc wizyty',
            `${reportTotals.avgVisitValue.toFixed(2)}`,
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
                    formatDuration(employee.workTimeMinutes),
                    employee.serviceRevenue.toFixed(2),
                    (employee.serviceRevenue / 1.23).toFixed(2),
                    employee.productRevenue.toFixed(2),
                    (employee.productRevenue / 1.23).toFixed(2),
                    employee.totalRevenue.toFixed(2),
                    reportTotals.dayRevenue > 0
                        ? (
                              (employee.totalRevenue /
                                  reportTotals.dayRevenue) *
                              100
                          ).toFixed(0) + '%'
                        : '0%',
                    employee.tips.toFixed(2),
                ].map((value) => String(value)),
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
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `raport-finansowy-${reportDate}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const reportLoading =
        rankingLoading ||
        commissionLoading ||
        dayRevenueLoading ||
        weekRevenueLoading ||
        monthRevenueLoading;

    const reportError =
        rankingError ||
        commissionError ||
        dayRevenueError ||
        weekRevenueError ||
        monthRevenueError;

    return (
        <div
            className="salonbw-page statistics-module"
            data-testid="statistics-page"
        >
            <ul className="breadcrumb">
                <li>Statystyki</li>
                <li>Raport finansowy</li>
            </ul>

            <div className="actions">
                <div className="pull-left statistics_date">
                    <button
                        type="button"
                        className="button button-link button_prev mr-s"
                        onClick={() => navigateDate('prev')}
                        aria-label="Poprzedni dzień"
                    >
                        <span
                            className="fc-icon fc-icon-left-single-arrow"
                            aria-hidden="true"
                        />
                    </button>
                    <div id="choose_date">
                        <form
                            className="date_range_box"
                            onSubmit={(event) => event.preventDefault()}
                        >
                            <input
                                id="date_range"
                                name="date_range"
                                type="text"
                                readOnly
                                value={reportDate}
                                aria-label="Data raportu"
                            />
                            <input
                                id="report-date-picker"
                                type="date"
                                className="statistics-date-picker-hidden"
                                value={reportDate}
                                aria-label="Wybierz datę raportu"
                                onChange={(event) =>
                                    setReportDate(event.target.value)
                                }
                            />
                        </form>
                    </div>
                    <button
                        type="button"
                        className="button button-link button_next ml-s"
                        onClick={() => navigateDate('next')}
                        aria-label="Następny dzień"
                    >
                        <span
                            className="fc-icon fc-icon-right-single-arrow"
                            aria-hidden="true"
                        />
                    </button>
                </div>
                <button
                    type="button"
                    className="button"
                    onClick={downloadCsvReport}
                >
                    <div
                        className="icon sprite-exel_blue mr-xs"
                        aria-hidden="true"
                    />
                    pobierz raport Excel
                </button>
                <button
                    type="button"
                    className="button button-link statistics-print-button"
                    onClick={() => window.print()}
                    aria-label="Drukuj"
                >
                    <div
                        className="icon sprite-print_blue"
                        aria-hidden="true"
                    />
                </button>
            </div>

            {reportLoading ? (
                <div className="salonbw-muted p-20">Ładowanie raportu...</div>
            ) : reportError ? (
                <div className="salonbw-muted p-20">
                    Nie udało się pobrać raportu finansowego.
                </div>
            ) : (
                <div className="statistics-description">
                    <h2>Salon ogółem</h2>
                    <p>
                        Liczba sfinalizowanych wizyt:{' '}
                        <strong>{reportTotals.totalVisits}</strong>
                        <br />
                        Łączny czas trwania sfinalizowanych wizyt:{' '}
                        <strong>
                            {formatDuration(reportTotals.totalWorkMinutes)}
                        </strong>
                    </p>
                    <br />

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
                                                <td>
                                                    {formatMoney(
                                                        reportTotals.dayServiceRevenue /
                                                            1.23,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        reportTotals.dayServiceRevenue,
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Sprzedaż towarów</th>
                                                <td>
                                                    {formatMoney(
                                                        reportTotals.dayProductRevenue /
                                                            1.23,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        reportTotals.dayProductRevenue,
                                                    )}
                                                </td>
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
                                                            reportTotals.dayRevenue,
                                                        )}
                                                        <br />
                                                    </strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Napiwki</th>
                                                <td className="statistics-td-no-right" />
                                                <td className="statistics-td-no-left">
                                                    {formatMoney(
                                                        reportTotals.dayTips,
                                                    )}
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
                                Sprzedaż usług <small>brutto</small>:{' '}
                                {formatMoney(reportTotals.dayServiceRevenue)}
                                <br />
                                Sprzedaż towarów <small>brutto</small>:{' '}
                                {formatMoney(reportTotals.dayProductRevenue)}
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
                                    data={paymentRows.map((row) => {
                                        const pct =
                                            paymentTotal > 0
                                                ? (row.amount / paymentTotal) *
                                                  100
                                                : paymentRows.length === 1
                                                  ? 100
                                                  : 0;
                                        const pctStr = Number.isInteger(pct)
                                            ? String(pct)
                                            : pct.toFixed(1).replace('.', ',');
                                        return {
                                            label: `${row.label}: ${formatMoney(row.amount)} (${pctStr}%)`,
                                            value: row.amount,
                                            color: row.color,
                                        };
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                    <br className="statistics-clearfix" />

                    <h2>Dane w podziale na pracowników</h2>
                    <div className="data_table">
                        <table className="table table-bordered">
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
                                        Sprzedaż towarów <small>brutto</small>
                                    </th>
                                    <th>
                                        Sprzedaż towarów <small>netto</small>
                                    </th>
                                    <th>
                                        Utarg <small>brutto</small>
                                    </th>
                                    <th>Procent</th>
                                </tr>
                                {employeeRows.map((employee, index) => (
                                    <tr
                                        key={employee.employeeId}
                                        className={
                                            index % 2 === 0 ? 'even' : 'odd'
                                        }
                                    >
                                        <td>{employee.employeeName}</td>
                                        <td>
                                            {employee.completedAppointments}
                                        </td>
                                        <td>
                                            {formatDuration(
                                                employee.workTimeMinutes,
                                            )}
                                        </td>
                                        <td>
                                            {employee.serviceRevenue.toFixed(2)}
                                            &nbsp;zł
                                        </td>
                                        <td>
                                            {(
                                                employee.serviceRevenue / 1.23
                                            ).toFixed(2)}
                                            &nbsp;zł
                                        </td>
                                        <td>
                                            {employee.productRevenue.toFixed(2)}
                                            &nbsp;zł
                                        </td>
                                        <td>
                                            {(
                                                employee.productRevenue / 1.23
                                            ).toFixed(2)}
                                            &nbsp;zł
                                        </td>
                                        <td>
                                            {employee.totalRevenue.toFixed(2)}
                                            &nbsp;zł
                                        </td>
                                        <td>
                                            {reportTotals.dayRevenue > 0
                                                ? `${((employee.totalRevenue / reportTotals.dayRevenue) * 100).toFixed(0)}%`
                                                : '0%'}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={9}>
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
                                        Sprzedaż towarów <small>brutto</small>
                                    </th>
                                    <th>
                                        Sprzedaż towarów <small>netto</small>
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
                                    <td>{reportTotals.totalVisits}</td>
                                    <td>
                                        {formatDuration(
                                            reportTotals.totalWorkMinutes,
                                        )}
                                    </td>
                                    <td>
                                        {formatMoney(
                                            reportTotals.dayServiceRevenue,
                                        )}
                                    </td>
                                    <td>
                                        {formatMoney(
                                            reportTotals.dayServiceRevenue /
                                                1.23,
                                        )}
                                    </td>
                                    <td>
                                        {formatMoney(
                                            reportTotals.dayProductRevenue,
                                        )}
                                    </td>
                                    <td>
                                        {formatMoney(
                                            reportTotals.dayProductRevenue /
                                                1.23,
                                        )}
                                    </td>
                                    <td>
                                        {formatMoney(reportTotals.dayRevenue)}
                                    </td>
                                    <td>100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="statistics-employee-chart-wrap">
                        <p className="statistics-chart-label">
                            Udział pracowników w utargu
                        </p>
                        <StatisticsPieChart
                            width={550}
                            height={320}
                            data={employeeChartData.map((employee) => ({
                                label: `${employee.label} (${employee.percent}%)`,
                                value: employee.value,
                                color: employee.color,
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
