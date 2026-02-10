import { useState } from 'react';
import Link from 'next/link';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTipsSummary } from '@/hooks/useStatistics';

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
        <VersumShell role={role}>
            <div className="versum-page" data-testid="tips-page">
                <header className="versum-page__header">
                    <h1 className="versum-page__title">Statystyki / Napiwki</h1>
                </header>

                <div className="versum-page__toolbar">
                    <div className="flex items-center gap-2">
                        <select
                            className="form-control versum-select"
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
                        className="btn btn-default versum-toolbar-btn"
                        onClick={() => window.print()}
                    >
                        🖨️
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-4 text-sm versum-muted">Ładowanie...</div>
                ) : (
                    <div className="inner">
                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="border rounded p-4 text-center bg-yellow-50">
                                <div className="text-sm text-gray-600 mb-2">
                                    Łącznie napiwków
                                </div>
                                <div className="text-2xl font-bold text-yellow-700">
                                    {formatMoney(totalTips)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    za {getRangeLabel()}
                                </div>
                            </div>

                            <div className="border rounded p-4 text-center">
                                <div className="text-sm text-gray-600 mb-2">
                                    Liczba napiwków
                                </div>
                                <div className="text-2xl font-bold">
                                    {totalCount}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    transakcje
                                </div>
                            </div>

                            <div className="border rounded p-4 text-center">
                                <div className="text-sm text-gray-600 mb-2">
                                    Średni napiwek
                                </div>
                                <div className="text-2xl font-bold">
                                    {formatMoney(avgTip)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    na transakcję
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="versum-table-wrap">
                            <table className="versum-table">
                                <thead>
                                    <tr>
                                        <th>Pracownik</th>
                                        <th className="text-right">
                                            Liczba napiwków
                                        </th>
                                        <th className="text-right">
                                            Suma napiwków
                                        </th>
                                        <th className="text-right">
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
                                                        href={`/employees/${employee.employeeId}`}
                                                        className="versum-link"
                                                    >
                                                        {employee.employeeName}
                                                    </Link>
                                                </td>
                                                <td className="text-right">
                                                    {employee.tipsCount}
                                                </td>
                                                <td className="text-right font-semibold">
                                                    {formatMoney(
                                                        employee.tipsTotal,
                                                    )}
                                                </td>
                                                <td className="text-right">
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
                                                className="text-center text-gray-500 py-4"
                                            >
                                                Brak napiwków w wybranym okresie
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {data && data.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold">
                                            <td>Łącznie</td>
                                            <td className="text-right">
                                                {totalCount}
                                            </td>
                                            <td className="text-right">
                                                {formatMoney(totalTips)}
                                            </td>
                                            <td className="text-right">
                                                {formatMoney(avgTip)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
