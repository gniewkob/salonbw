import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import Link from 'next/link';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

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
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const [data, setData] = useState<CommissionReportSummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/statistics/commissions?range=today&date=${selectedDate}`,
            );
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch commissions:', error);
        }
        setLoading(false);
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate);
        const newDate =
            direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

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
                    <div className="flex gap-2">
                        <button type="button" className="btn btn-default">
                            pobierz raport Excel
                        </button>
                        <button
                            type="button"
                            className="versum-toolbar-btn btn btn-default"
                            onClick={() => window.print()}
                        >
                            🖨️
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 text-sm versum-muted">Ładowanie...</div>
                ) : (
                    <div className="inner">
                        {data && (
                            <div className="versum-table-wrap">
                                <table className="versum-table">
                                    <thead>
                                        <tr>
                                            <th>Pracownik</th>
                                            <th>Obroty na usługach</th>
                                            <th>Prowizja od usług</th>
                                            <th>Obroty na produktach</th>
                                            <th>Prowizja z produktów</th>
                                            <th>Łącznie obroty brutto</th>
                                            <th>Łącznie prowizja</th>
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
                                                        {employee.employeeName}
                                                    </Link>
                                                    <Link
                                                        href={`/statistics/commissions/${employee.employeeId}?date=${selectedDate}`}
                                                        className="versum-link ml-2 text-xs"
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
                                        ))}
                                        <tr className="bg-gray-100">
                                            <td
                                                colSpan={7}
                                                className="font-bold"
                                            >
                                                Podsumowanie
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <th></th>
                                            <th>Obroty na usługach</th>
                                            <th>Prowizja od usług</th>
                                            <th>Obroty na produktach</th>
                                            <th>Prowizja z produktów</th>
                                            <th>Łącznie obroty brutto</th>
                                            <th>Łącznie prowizja</th>
                                        </tr>
                                        <tr className="bg-gray-50 font-bold">
                                            <td>Łącznie</td>
                                            <td>
                                                {formatMoney(
                                                    data.totals.serviceRevenue,
                                                )}{' '}
                                                brutto
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {formatMoney(
                                                        data.totals
                                                            .serviceRevenue *
                                                            0.77,
                                                    )}{' '}
                                                    netto
                                                </span>
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    data.totals
                                                        .serviceCommission,
                                                )}{' '}
                                                brutto
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {formatMoney(
                                                        data.totals
                                                            .serviceCommission *
                                                            0.77,
                                                    )}{' '}
                                                    netto
                                                </span>
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    data.totals.productRevenue,
                                                )}{' '}
                                                brutto
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {formatMoney(
                                                        data.totals
                                                            .productRevenue *
                                                            0.77,
                                                    )}{' '}
                                                    netto
                                                </span>
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    data.totals
                                                        .productCommission,
                                                )}{' '}
                                                brutto
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {formatMoney(
                                                        data.totals
                                                            .productCommission *
                                                            0.77,
                                                    )}{' '}
                                                    netto
                                                </span>
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    data.totals.totalRevenue,
                                                )}{' '}
                                                brutto
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {formatMoney(
                                                        data.totals
                                                            .totalRevenue *
                                                            0.77,
                                                    )}{' '}
                                                    netto
                                                </span>
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    data.totals.totalCommission,
                                                )}{' '}
                                                brutto
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
