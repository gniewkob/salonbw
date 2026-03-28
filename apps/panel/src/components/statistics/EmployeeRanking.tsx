'use client';

import type { EmployeeStats } from '@/types';

interface Props {
    data: EmployeeStats[];
    loading?: boolean;
}

export default function EmployeeRanking({ data, loading }: Props) {
    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center py-4">
                <div className="rounded-circle h-6 w-6 border-bottom-2 border-primary"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-4 text-muted">
                Brak danych dla wybranego okresu
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-100">
                <thead className="bg-light">
                    <tr>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            #
                        </th>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Pracownik
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Przychód
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Wizyty
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Śr. wartość
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Napiwki
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Ocena
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((employee, index) => (
                        <tr key={employee.employeeId} className="">
                            <td className="px-3 py-2 text-nowrap">
                                <span
                                    className={`inline-d-flex align-items-center justify-content-center w-6 h-6 rounded-circle small fw-bold ${
                                        index === 0
                                            ? 'bg-warning bg-opacity-10 text-warning'
                                            : index === 1
                                              ? 'bg-secondary bg-opacity-25 text-body'
                                              : index === 2
                                                ? 'bg-warning bg-opacity-10 text-warning'
                                                : 'bg-light text-muted'
                                    }`}
                                >
                                    {index + 1}
                                </span>
                            </td>
                            <td className="px-3 py-2 text-nowrap">
                                <span className="fw-medium text-dark">
                                    {employee.employeeName}
                                </span>
                            </td>
                            <td className="px-3 py-2 text-nowrap text-end">
                                <span className="fw-semibold text-dark">
                                    {employee.revenue.toLocaleString('pl-PL')}{' '}
                                    PLN
                                </span>
                            </td>
                            <td className="px-3 py-2 text-nowrap text-end text-muted">
                                {employee.appointments}
                            </td>
                            <td className="px-3 py-2 text-nowrap text-end text-muted">
                                {employee.averageRevenue.toLocaleString(
                                    'pl-PL',
                                    {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    },
                                )}{' '}
                                PLN
                            </td>
                            <td className="px-3 py-2 text-nowrap text-end">
                                <span className="text-success fw-medium">
                                    {employee.tips.toLocaleString('pl-PL')} PLN
                                </span>
                            </td>
                            <td className="px-3 py-2 text-nowrap text-end">
                                {employee.rating > 0 ? (
                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                        <svg
                                            className="w-4 h-4 text-warning"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-body">
                                            {employee.rating.toFixed(1)}
                                        </span>
                                        <span className="small text-secondary">
                                            ({employee.reviewCount})
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-secondary">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
