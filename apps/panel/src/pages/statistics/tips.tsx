import { useState } from 'react';
import Link from 'next/link';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useTipsSummary } from '@/hooks/useStatistics';

const EMPLOYEE_DETAILS_BASE_PATH = '/settings/employees';

export default function TipsPage() {
    const { role } = useAuth();
    const [range, setRange] = useState<'today' | 'this_week' | 'this_month'>(
        'this_month',
    );
    const { data, isLoading } = useTipsSummary({ range });

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

    const getRangeLabel = () => {
        switch (range) {
            case 'today':
                return 'dzisiaj';
            case 'this_week':
                return 'ten tydzień';
            case 'this_month':
                return 'ten miesiąc';
            default:
                return '';
        }
    };

    if (!role) return null;

    const totalTips = data?.reduce((sum, item) => sum + item.tipsTotal, 0) || 0;
    const totalCount =
        data?.reduce((sum, item) => sum + item.tipsCount, 0) || 0;
    const avgTip = totalCount > 0 ? totalTips / totalCount : 0;

    return (
        <SalonShell role={role}>
            <div className="salonbw-page" data-testid="tips-page">
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_statistics"
                    items={[
                        { label: 'Statystyki', href: '/statistics' },
                        { label: 'Napiwki' },
                    ]}
                />

                <div className="salonbw-page__toolbar">
                    <div className="d-flex align-items-center gap-2">
                        <select
                            className="form-control salonbw-select"
                            aria-label="Zakres czasu"
                            value={range}
                            onChange={(e) => {
                                const next = e.target.value;
                                if (
                                    next === 'today' ||
                                    next === 'this_week' ||
                                    next === 'this_month'
                                ) {
                                    setRange(next);
                                }
                            }}
                        >
                            <option value="today">dzisiaj</option>
                            <option value="this_week">ten tydzień</option>
                            <option value="this_month">ten miesiąc</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        className="btn btn-default salonbw-toolbar-btn"
                        onClick={() => window.print()}
                    >
                        🖨️
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-4 small salonbw-muted">Ładowanie...</div>
                ) : (
                    <>
                        {/* Summary cards */}
                        <div className="row g-4 mb-5">
                            <div className="col-4">
                                <div className="border rounded p-4 text-center bg-warning bg-opacity-10">
                                    <div className="small text-muted mb-2">
                                        Łącznie napiwków
                                    </div>
                                    <div className="fs-3 fw-bold text-warning">
                                        {formatMoney(totalTips)}
                                    </div>
                                    <div className="small text-muted mt-1">
                                        za {getRangeLabel()}
                                    </div>
                                </div>
                            </div>

                            <div className="col-4">
                                <div className="border rounded p-4 text-center">
                                    <div className="small text-muted mb-2">
                                        Liczba napiwków
                                    </div>
                                    <div className="fs-3 fw-bold">
                                        {totalCount}
                                    </div>
                                    <div className="small text-muted mt-1">
                                        transakcje
                                    </div>
                                </div>
                            </div>

                            <div className="col-4">
                                <div className="border rounded p-4 text-center">
                                    <div className="small text-muted mb-2">
                                        Średni napiwek
                                    </div>
                                    <div className="fs-3 fw-bold">
                                        {formatMoney(avgTip)}
                                    </div>
                                    <div className="small text-muted mt-1">
                                        na transakcję
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="salonbw-table-wrap">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Pracownik</th>
                                        <th className="text-end">
                                            Liczba napiwków
                                        </th>
                                        <th className="text-end">
                                            Suma napiwków
                                        </th>
                                        <th className="text-end">
                                            Średni napiwek
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data && data.length > 0 ? (
                                        data.map((employee) => (
                                            <tr key={employee.employeeId}>
                                                <td>
                                                    <Link
                                                        href={`${EMPLOYEE_DETAILS_BASE_PATH}/${employee.employeeId}`}
                                                        className="salonbw-link"
                                                    >
                                                        {employee.employeeName}
                                                    </Link>
                                                </td>
                                                <td className="text-end">
                                                    {employee.tipsCount}
                                                </td>
                                                <td className="text-end fw-semibold">
                                                    {formatMoney(
                                                        employee.tipsTotal,
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    {formatMoney(
                                                        employee.averageTip,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-center text-muted py-4"
                                            >
                                                Brak napiwków w wybranym okresie
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {data && data.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-light fw-bold">
                                            <td>Łącznie</td>
                                            <td className="text-end">
                                                {totalCount}
                                            </td>
                                            <td className="text-end">
                                                {formatMoney(totalTips)}
                                            </td>
                                            <td className="text-end">
                                                {formatMoney(avgTip)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </>
                )}
            </div>
        </SalonShell>
    );
}
