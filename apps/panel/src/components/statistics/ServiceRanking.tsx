'use client';

import type { ServiceStats } from '@/types';

interface Props {
    data: ServiceStats[];
    loading?: boolean;
}

export default function ServiceRanking({ data, loading }: Props) {
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

    // Find max booking count for progress bars
    const maxBookings = Math.max(...data.map((s) => s.bookingCount));

    return (
        <div className="overflow-x-auto">
            <table className="min-w-100">
                <thead className="bg-light">
                    <tr>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Usługa
                        </th>
                        <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                            Kategoria
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Rezerwacje
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Przychód
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Śr. cena
                        </th>
                        <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                            Śr. czas
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((service) => {
                        const width = maxBookings
                            ? `${(service.bookingCount / maxBookings) * 100}%`
                            : '0%';
                        return (
                            <tr key={service.serviceId} className="">
                                <td className="px-3 py-2">
                                    <div className="fw-medium text-dark">
                                        {service.serviceName}
                                    </div>
                                    <div className="mt-1 w-100 bg-secondary bg-opacity-25 rounded-circle h-1.5">
                                        <div
                                            className="bg-primary bg-opacity-10 h-1.5 rounded-circle"
                                            style={{ width }}
                                        />
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-nowrap">
                                    {service.categoryName ? (
                                        <span className="px-2 py-1 small rounded-circle bg-light text-muted">
                                            {service.categoryName}
                                        </span>
                                    ) : (
                                        <span className="text-secondary">
                                            -
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-nowrap text-end">
                                    <span className="fw-semibold text-dark">
                                        {service.bookingCount}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-nowrap text-end">
                                    <span className="fw-semibold text-dark">
                                        {service.revenue.toLocaleString(
                                            'pl-PL',
                                        )}{' '}
                                        PLN
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-nowrap text-end text-muted">
                                    {service.averagePrice.toLocaleString(
                                        'pl-PL',
                                        {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        },
                                    )}{' '}
                                    PLN
                                </td>
                                <td className="px-3 py-2 text-nowrap text-end text-muted">
                                    {service.averageDuration} min
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
