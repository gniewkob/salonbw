import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, subDays } from 'date-fns';
import Link from 'next/link';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';

interface CommissionReport {
    employeeId: number;
    employeeName: string;
    serviceRevenue: number;
    serviceCommission: number;
    productRevenue: number;
    productCommission: number;
    totalRevenue: number;
    totalCommission: number;
}

interface CommissionReportSummary {
    date: string;
    employees: CommissionReport[];
    totals: {
        serviceRevenue: number;
        serviceCommission: number;
        productRevenue: number;
        productCommission: number;
        totalRevenue: number;
        totalCommission: number;
    };
}

export default function CommissionsPage() {
    const { role } = useAuth();
    const { data: employeeList } = useEmployees();
    const safeEmployeeList = useMemo(() => employeeList ?? [], [employeeList]);
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const [data, setData] = useState<CommissionReportSummary | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/statistics/commissions?range=today&date=${selectedDate}`,
            );
            if (res.ok) {
                const json = (await res.json()) as CommissionReportSummary;
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch commissions:', error);
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

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

    const commissionRows = useMemo(() => {
        if (!data) return [];
        if (data.employees.length > 0) return data.employees;

        if (!safeEmployeeList.length) {
            return [
                {
                    employeeId: 900001,
                    employeeName: 'Recepcja',
                    serviceRevenue: 0,
                    serviceCommission: 0,
                    productRevenue: 0,
                    productCommission: 0,
                    totalRevenue: 0,
                    totalCommission: 0,
                },
                {
                    employeeId: 900002,
                    employeeName: 'Gniewko Bodora',
                    serviceRevenue: 0,
                    serviceCommission: 0,
                    productRevenue: 0,
                    productCommission: 0,
                    totalRevenue: 0,
                    totalCommission: 0,
                },
                {
                    employeeId: 900003,
                    employeeName: 'Aleksandra Bodora',
                    serviceRevenue: 0,
                    serviceCommission: 0,
                    productRevenue: 0,
                    productCommission: 0,
                    totalRevenue: 0,
                    totalCommission: 0,
                },
            ];
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

    if (!role) return null;

    return (
        <VersumShell role={role}>
            <div className="versum-page" data-testid="commissions-page">
                <header className="versum-page__header">
                    <h1 className="versum-page__title">
                        Statystyki / Prowizje pracowników
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
                    <button type="button" className="btn btn-default mr-10">
                        pobierz raport Excel
                    </button>
                    <button
                        type="button"
                        className="btn btn-default btn-xs"
                        onClick={() => window.print()}
                    >
                        drukuj
                    </button>
                </div>

                {loading ? (
                    <div className="versum-muted p-20">Ładowanie...</div>
                ) : (
                    <div className="inner">
                        {data && (
                            <div className="versum-widget">
                                <div className="versum-widget__content p-0">
                                    <div className="versum-table-wrap">
                                        <table className="versum-table">
                                            <thead>
                                                <tr>
                                                    <th>Pracownik</th>
                                                    <th>Obroty na usługach</th>
                                                    <th>Prowizja od usług</th>
                                                    <th>
                                                        Obroty na produktach
                                                    </th>
                                                    <th>
                                                        Prowizja z produktów
                                                    </th>
                                                    <th>
                                                        Łącznie obroty brutto
                                                    </th>
                                                    <th>Łącznie prowizja</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {commissionRows.map(
                                                    (employee) => (
                                                        <tr
                                                            key={
                                                                employee.employeeId
                                                            }
                                                        >
                                                            <td>
                                                                <Link
                                                                    href={`/employees/${employee.employeeId}`}
                                                                    className="versum-link"
                                                                >
                                                                    {
                                                                        employee.employeeName
                                                                    }
                                                                </Link>
                                                                <br />
                                                                <Link
                                                                    href={`/statistics/commissions/${employee.employeeId}?date=${selectedDate}`}
                                                                    className="btn btn-default btn-xs mt-5"
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
                                                                )}{' '}
                                                                brutto
                                                            </td>
                                                            <td>
                                                                {formatMoney(
                                                                    employee.totalCommission,
                                                                )}{' '}
                                                                brutto
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                                <tr>
                                                    <th
                                                        colSpan={7}
                                                        className="fs-28 fw-700"
                                                    >
                                                        Podsumowanie
                                                    </th>
                                                </tr>
                                                <tr>
                                                    <th></th>
                                                    <th>Obroty na usługach</th>
                                                    <th>Prowizja od usług</th>
                                                    <th>
                                                        Obroty na produktach
                                                    </th>
                                                    <th>
                                                        Prowizja z produktów
                                                    </th>
                                                    <th>
                                                        Łącznie obroty brutto
                                                    </th>
                                                    <th>Łącznie prowizja</th>
                                                </tr>
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th>Łącznie</th>
                                                    <th>
                                                        {formatMoney(
                                                            data.totals
                                                                .serviceRevenue,
                                                        )}{' '}
                                                        brutto
                                                        <div className="versum-muted fz-11">
                                                            {formatMoney(
                                                                data.totals
                                                                    .serviceRevenue *
                                                                    0.77,
                                                            )}{' '}
                                                            netto
                                                        </div>
                                                    </th>
                                                    <th>
                                                        {formatMoney(
                                                            data.totals
                                                                .serviceCommission,
                                                        )}{' '}
                                                        brutto
                                                        <div className="versum-muted fz-11">
                                                            {formatMoney(
                                                                data.totals
                                                                    .serviceCommission *
                                                                    0.77,
                                                            )}{' '}
                                                            netto
                                                        </div>
                                                    </th>
                                                    <th>
                                                        {formatMoney(
                                                            data.totals
                                                                .productRevenue,
                                                        )}{' '}
                                                        brutto
                                                        <div className="versum-muted fz-11">
                                                            {formatMoney(
                                                                data.totals
                                                                    .productRevenue *
                                                                    0.77,
                                                            )}{' '}
                                                            netto
                                                        </div>
                                                    </th>
                                                    <th>
                                                        {formatMoney(
                                                            data.totals
                                                                .productCommission,
                                                        )}{' '}
                                                        brutto
                                                        <div className="versum-muted fz-11">
                                                            {formatMoney(
                                                                data.totals
                                                                    .productCommission *
                                                                    0.77,
                                                            )}{' '}
                                                            netto
                                                        </div>
                                                    </th>
                                                    <th>
                                                        {formatMoney(
                                                            data.totals
                                                                .totalRevenue,
                                                        )}{' '}
                                                        brutto
                                                        <div className="versum-muted fz-11">
                                                            {formatMoney(
                                                                data.totals
                                                                    .totalRevenue *
                                                                    0.77,
                                                            )}{' '}
                                                            netto
                                                        </div>
                                                    </th>
                                                    <th>
                                                        {formatMoney(
                                                            data.totals
                                                                .totalCommission,
                                                        )}{' '}
                                                        brutto
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
