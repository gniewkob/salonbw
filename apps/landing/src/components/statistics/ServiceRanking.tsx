'use client';

import type { ServiceStats } from '@/types';

interface Props {
    data: ServiceStats[];
    loading?: boolean;
}

export default function ServiceRanking({ data, loading }: Props) {
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

    // Find max booking count for progress bars
    const maxBookings = Math.max(...data.map((s) => s.bookingCount));

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usługa
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategoria
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rezerwacje
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Przychód
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Śr. cena
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Śr. czas
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((service) => (
                        <tr key={service.serviceId} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                    {service.serviceName}
                                </div>
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-primary-500 h-1.5 rounded-full"
                                        style={{
                                            width: `${(service.bookingCount / maxBookings) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {service.categoryName ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                        {service.categoryName}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="font-semibold text-gray-900">
                                    {service.bookingCount}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="font-semibold text-gray-900">
                                    {service.revenue.toLocaleString('pl-PL')} PLN
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
                                {service.averagePrice.toLocaleString('pl-PL', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                })}{' '}
                                PLN
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
                                {service.averageDuration} min
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
