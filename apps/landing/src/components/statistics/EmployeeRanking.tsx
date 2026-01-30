'use client';

import type { EmployeeStats } from '@/types';

interface Props {
    data: EmployeeStats[];
    loading?: boolean;
}

export default function EmployeeRanking({ data, loading }: Props) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Brak danych dla wybranego okresu
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pracownik
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Przychód
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wizyty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Śr. wartość
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Napiwki
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ocena
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((employee, index) => (
                        <tr key={employee.employeeId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                        index === 0
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : index === 1
                                              ? 'bg-gray-200 text-gray-700'
                                              : index === 2
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    {index + 1}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className="font-medium text-gray-900">
                                    {employee.employeeName}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="font-semibold text-gray-900">
                                    {employee.revenue.toLocaleString('pl-PL')} PLN
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
                                {employee.appointments}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
                                {employee.averageRevenue.toLocaleString('pl-PL', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                })}{' '}
                                PLN
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="text-green-600 font-medium">
                                    {employee.tips.toLocaleString('pl-PL')} PLN
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                {employee.rating > 0 ? (
                                    <div className="flex items-center justify-end gap-1">
                                        <svg
                                            className="w-4 h-4 text-yellow-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-gray-700">
                                            {employee.rating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            ({employee.reviewCount})
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
