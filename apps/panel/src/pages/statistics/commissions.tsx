import { useMemo, useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import Link from 'next/link';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useCommissionReport } from '@/hooks/useStatistics';

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

export default function CommissionsPage() {
    const { role } = useAuth();
    const { data: employeeList } = useEmployees();
    const safeEmployeeList = useMemo(() => employeeList ?? [], [employeeList]);
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const from = `${selectedDate}T00:00:00.000Z`;
    const to = `${selectedDate}T23:59:59.999Z`;
    const {
        data,
        isLoading: loading,
        error,
    } = useCommissionReport({
        range: 'custom',
        from,
        to,
    });

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate);
        const newDate =
            direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    const formatMoney = (value: unknown): string => {
        return toNumber(value).toFixed(2).replace('.', ',') + ' zł';
    };

    const commissionRows = useMemo(() => {
        if (data?.employees?.length) {
            return data.employees.map((employee) => ({
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                serviceRevenue: toNumber(employee.serviceRevenue),
                serviceCommission: toNumber(employee.serviceCommission),
                productRevenue: toNumber(employee.productRevenue),
                productCommission: toNumber(employee.productCommission),
                totalRevenue: toNumber(employee.totalRevenue),
                totalCommission: toNumber(employee.totalCommission),
            }));
        }

        if (!safeEmployeeList.length) {
            return [];
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
                serviceRevenue: 0,
                serviceCommission: 0,
                productRevenue: 0,
                productCommission: 0,
                totalRevenue: 0,
                totalCommission: 0,
            };
        });
    }, [data, safeEmployeeList]);
    const totals = data?.totals ?? {
        serviceRevenue: 0,
        serviceCommission: 0,
        productRevenue: 0,
        productCommission: 0,
        totalRevenue: 0,
        totalCommission: 0,
    };
    const safeTotals = {
        serviceRevenue: toNumber(totals.serviceRevenue),
        serviceCommission: toNumber(totals.serviceCommission),
        productRevenue: toNumber(totals.productRevenue),
        productCommission: toNumber(totals.productCommission),
        totalRevenue: toNumber(totals.totalRevenue),
        totalCommission: toNumber(totals.totalCommission),
    };

    if (!role) return null;

    return (
        <VersumShell role={role}>
            <div
                className="versum-page statistics-module"
                data-testid="commissions-page"
            >
                <ul className="breadcrumb">
                    <li>Statystyki</li>
                    <li>Prowizje pracowników</li>
                </ul>

                <div className="statistics-actions">
                    <div className="statistics-date-wrap">
                        <button
                            type="button"
                            className="button button-link button_prev mr-s"
                            onClick={() => navigateDate('prev')}
                            aria-label="Poprzedni dzień"
                        >
                            <span className="fc-icon fc-icon-left-single-arrow" />
                        </button>
                        <input
                            type="text"
                            id="date_range"
                            className="statistics-date-input"
                            readOnly
                            value={selectedDate}
                            aria-label="Data"
                        />
                        <button
                            type="button"
                            className="button button-link button_next ml-s"
                            onClick={() => navigateDate('next')}
                            aria-label="Następny dzień"
                        >
                            <span className="fc-icon fc-icon-right-single-arrow" />
                        </button>
                    </div>
                    <button type="button" className="button" disabled>
                        <div
                            className="icon sprite-exel_blue mr-xs"
                            aria-hidden="true"
                        />
                        pobierz raport Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        aria-label="Drukuj"
                    >
                        <div
                            className="icon sprite-print_blue"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                {loading ? (
                    <div className="versum-muted p-20">Ładowanie...</div>
                ) : error ? (
                    <div className="versum-muted p-20">
                        Nie udało się pobrać raportu prowizji.
                    </div>
                ) : (
                    <div className="overflow_hidden">
                        <div className="description">
                            <div className="data_table">
                                <table className="table table-bordered">
                                    <tbody>
                                        <tr>
                                            <th>Pracownik</th>
                                            <th>Obroty na usługach</th>
                                            <th>Prowizja od usług</th>
                                            <th>Obroty na produktach</th>
                                            <th>Prowizja z produktów</th>
                                            <th>
                                                Łącznie obroty{' '}
                                                <small>brutto</small>
                                            </th>
                                            <th>Łącznie prowizja</th>
                                        </tr>
                                        {commissionRows.map((employee, i) => (
                                            <tr
                                                key={employee.employeeId}
                                                className={
                                                    i % 2 === 0 ? 'even' : 'odd'
                                                }
                                            >
                                                <td>
                                                    <Link
                                                        href={`/employees/${employee.employeeId}`}
                                                        className="versum-link"
                                                    >
                                                        {employee.employeeName}
                                                    </Link>
                                                    <br />
                                                    <Link
                                                        href={`/statistics/commissions/${employee.employeeId}?date=${selectedDate}`}
                                                        className="button mt-xs"
                                                    >
                                                        szczegóły
                                                    </Link>
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        employee.serviceRevenue,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        employee.serviceCommission,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        employee.productRevenue,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        employee.productCommission,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        employee.totalRevenue,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatMoney(
                                                        employee.totalCommission,
                                                    )}
                                                    <small>brutto</small>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={7}>
                                                <strong>Podsumowanie</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th aria-label="Pracownik" />
                                            <th>Obroty na usługach</th>
                                            <th>Prowizja od usług</th>
                                            <th>Obroty na produktach</th>
                                            <th>Prowizja z produktów</th>
                                            <th>Łącznie obroty brutto</th>
                                            <th>Łącznie prowizja</th>
                                        </tr>
                                        <tr>
                                            <td>
                                                <strong>Łącznie</strong>
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    safeTotals.serviceRevenue,
                                                )}{' '}
                                                brutto
                                                <br />
                                                {formatMoney(
                                                    safeTotals.serviceRevenue /
                                                        1.23,
                                                )}{' '}
                                                netto
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    safeTotals.serviceCommission,
                                                )}{' '}
                                                brutto
                                                <br />
                                                {formatMoney(
                                                    safeTotals.serviceCommission /
                                                        1.23,
                                                )}{' '}
                                                netto
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    safeTotals.productRevenue,
                                                )}{' '}
                                                brutto
                                                <br />
                                                {formatMoney(
                                                    safeTotals.productRevenue /
                                                        1.23,
                                                )}{' '}
                                                netto
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    safeTotals.productCommission,
                                                )}{' '}
                                                brutto
                                                <br />
                                                {formatMoney(
                                                    safeTotals.productCommission /
                                                        1.23,
                                                )}{' '}
                                                netto
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    safeTotals.totalRevenue,
                                                )}
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    safeTotals.totalCommission,
                                                )}{' '}
                                                brutto
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
