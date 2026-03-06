import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useDashboardStats, useEmployeeRanking } from '@/hooks/useStatistics';
import { useCashRegister } from '@/hooks/useStatistics';
import { useEmployees } from '@/hooks/useEmployees';
import { DateRange } from '@/types';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

const VISUAL_FALLBACK_EMPLOYEES = [
    { id: -1, name: 'Recepcja' },
    { id: -2, name: 'Gniewko Bodora' },
    { id: -3, name: 'Aleksandra Bodora' },
];

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
        const totals = registerSummary?.totals;
        const candidates = [
            { key: 'cash', label: 'gotówka', color: '#86c92a' },
            { key: 'card', label: 'karta kredytowa', color: '#2b9ad0' },
            { key: 'transfer', label: 'przelew', color: '#f0ad4e' },
            { key: 'online', label: 'online', color: '#8e44ad' },
            { key: 'voucher', label: 'voucher', color: '#7f8c8d' },
        ] as const;

        const rows = candidates
            .map((item) => ({
                ...item,
                amount: toNumber(totals?.[item.key]),
            }))
            .filter((item) => item.amount > 0);

        if (!rows.length) {
            return [
                {
                    key: 'cash',
                    label: 'gotówka',
                    color: '#86c92a',
                    amount: toNumber(totals?.total) || toNumber(totals?.cash),
                },
            ];
        }
        return rows;
    }, [registerSummary]);

    const paymentTotal = useMemo(() => {
        return paymentRows.reduce((acc, item) => acc + item.amount, 0);
    }, [paymentRows]);

    const paymentPieBackground = useMemo(() => {
        if (paymentTotal <= 0) {
            return '#86c92a';
        }
        let current = 0;
        const segments = paymentRows.map((item) => {
            const start = current;
            const share = (item.amount / paymentTotal) * 100;
            current += share;
            return `${item.color} ${start.toFixed(3)}% ${current.toFixed(3)}%`;
        });
        return `conic-gradient(${segments.join(', ')})`;
    }, [paymentRows, paymentTotal]);

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

            <div className="versum-page__toolbar">
                <div className="btn-group mr-10" role="group">
                    <button type="button" className="btn btn-default" disabled>
                        ◀
                    </button>
                    <input
                        id="report-date"
                        className="form-control statistics-date-input"
                        type="text"
                        readOnly
                        value={reportDate}
                        aria-label="Data raportu"
                    />
                    <label
                        htmlFor="report-date-picker"
                        className="btn btn-default statistics-date-picker-btn"
                        aria-label="Wybierz datę"
                    >
                        📅
                        <input
                            id="report-date-picker"
                            type="date"
                            className="statistics-date-picker-hidden"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                        />
                    </label>
                    <button type="button" className="btn btn-default" disabled>
                        ▶
                    </button>
                </div>
                <div className="ml-auto" />
                <button
                    type="button"
                    className="btn btn-default btn-versum-blue mr-10"
                    onClick={downloadCsvReport}
                    disabled={dashboardLoading || rankingLoading}
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
                    <h2 className="statistics-dashboard-title">Salon ogółem</h2>
                    <div className="mb-10 fs-12">
                        Liczba sfinalizowanych wizyt: {totals.totalVisits}
                    </div>
                    <div className="mb-20 fs-12">
                        Łączny czas trwania sfinalizowanych wizyt:{' '}
                        {formatDuration(totalWorkMinutes)}
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
                                    {formatMoney(
                                        toNumber(registerSummary?.totals?.cash),
                                    )}
                                </div>
                                <div>Wpływy: {formatMoney(paymentTotal)}</div>
                                <div>Wydatki: {formatMoney(0)}</div>
                            </div>
                        </div>
                        <div className="statistics-summary-row__right">
                            <div className="statistics-payment-title fs-20 fw-600">
                                Udział metod płatności w utargu{' '}
                                <span
                                    className="statistics-info-icon"
                                    title="Informacja o metodach płatności"
                                    aria-label="Informacja"
                                >
                                    ℹ
                                </span>
                            </div>
                            <div className="statistics-payment-box mt-10">
                                <div className="statistics-payment-row">
                                    <div
                                        aria-hidden
                                        className="statistics-payment-pie"
                                        {...{
                                            style: {
                                                background:
                                                    paymentPieBackground,
                                            },
                                        }}
                                    />
                                    <div className="fs-12">
                                        {paymentRows.map((item) => {
                                            const percent =
                                                paymentTotal > 0
                                                    ? (
                                                          (item.amount /
                                                              paymentTotal) *
                                                          100
                                                      ).toFixed(1)
                                                    : '0,0';
                                            return (
                                                <div key={item.key}>
                                                    <span
                                                        className="statistics-payment-dot"
                                                        {...{
                                                            style: {
                                                                background:
                                                                    item.color,
                                                                borderColor:
                                                                    item.color,
                                                            },
                                                        }}
                                                    />
                                                    {item.label}:{' '}
                                                    {formatMoney(item.amount)} (
                                                    {percent}%)
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
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

                    <div className="statistics-dashboard-section-title">
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
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>
                                                {(
                                                    toNumber(employee.revenue) *
                                                    0.77
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>0,00 zł</td>
                                            <td>0,00 zł</td>
                                            <td>
                                                {toNumber(
                                                    employee.revenue,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>
                                                {totals.totalRevenue > 0
                                                    ? `${((toNumber(employee.revenue) / toNumber(totals.totalRevenue)) * 100).toFixed(0)}%`
                                                    : '0%'}
                                            </td>
                                            <td>
                                                {toNumber(
                                                    employee.tips,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th>Łącznie</th>
                                        <th>{totals.totalVisits}</th>
                                        <th>
                                            {formatDuration(totalWorkMinutes)}
                                        </th>
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
                    <div className="statistics-employee-box">
                        <div className="statistics-payment-row">
                            <div
                                aria-hidden
                                className="statistics-employee-pie"
                                {...{
                                    style: {
                                        background:
                                            'conic-gradient(#2a9fd6 0 33%, #e0552f 33% 66%, #86c92a 66% 100%)',
                                    },
                                }}
                            />
                            <div className="fs-12">
                                {employeeRows.slice(0, 3).map((employee) => (
                                    <div key={employee.employeeId}>
                                        <span
                                            className="statistics-payment-dot"
                                            {...{
                                                style: {
                                                    background:
                                                        employee.employeeId ===
                                                        employeeRows[0]
                                                            ?.employeeId
                                                            ? '#86c92a'
                                                            : employee.employeeId ===
                                                                employeeRows[1]
                                                                    ?.employeeId
                                                              ? '#2a9fd6'
                                                              : '#e0552f',
                                                },
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
