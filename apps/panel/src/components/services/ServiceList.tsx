'use client';

import type { Service, ServiceCategory } from '@/types';

interface Props {
    services: Service[];
    categories: ServiceCategory[];
    onEdit: (service: Service) => void;
    onDelete: (id: number) => Promise<void> | void;
    onToggleActive: (id: number, isActive: boolean) => Promise<void> | void;
    onManageVariants: (service: Service) => void;
    onOpenDetails: (service: Service) => void;
}

export default function ServiceList({
    services,
    categories,
    onEdit,
    onDelete,
    onToggleActive,
    onManageVariants,
    onOpenDetails,
}: Props) {
    const formatPrice = (price: number, priceType: string) => {
        const formatted = new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(price);
        return priceType === 'from' ? `od ${formatted}` : formatted;
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} godz. ${mins} min` : `${hours} godz.`;
    };

    const getCategoryName = (categoryId?: number) => {
        if (!categoryId) return 'Bez kategorii';
        const findCategory = (cats: ServiceCategory[]): string | null => {
            for (const cat of cats) {
                if (cat.id === categoryId) return cat.name;
                if (cat.children) {
                    const found = findCategory(cat.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findCategory(categories) || 'Bez kategorii';
    };

    if (services.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-gray-400 mb-4">
                    <svg
                        className="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </div>
                <p className="text-gray-500">Brak usług w tej kategorii</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usługa
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategoria
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Czas
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cena
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Online
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aktywna
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Akcje
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {services.map((service) => (
                        <tr
                            key={service.id}
                            className={`hover:bg-gray-50 ${!service.isActive ? 'opacity-60' : ''}`}
                        >
                            <td className="px-4 py-3">
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {service.name}
                                    </div>
                                    {service.description && (
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                            {service.description}
                                        </div>
                                    )}
                                    {service.variants &&
                                        service.variants.length > 0 && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                                    {service.variants.length}{' '}
                                                    wariant
                                                    {service.variants.length ===
                                                    1
                                                        ? ''
                                                        : service.variants
                                                                .length < 5
                                                          ? 'y'
                                                          : 'ów'}
                                                </span>
                                            </div>
                                        )}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {getCategoryName(service.categoryId)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDuration(service.duration)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                {formatPrice(service.price, service.priceType)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {service.onlineBooking ? (
                                    <span
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600"
                                        title="Dostępna online"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                ) : (
                                    <span
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400"
                                        title="Niedostępna online"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void onToggleActive(
                                            service.id,
                                            !service.isActive,
                                        )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        service.isActive
                                            ? 'bg-primary-600'
                                            : 'bg-gray-300'
                                    }`}
                                    aria-label={
                                        service.isActive
                                            ? 'Dezaktywuj usługę'
                                            : 'Aktywuj usługę'
                                    }
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            service.isActive
                                                ? 'translate-x-6'
                                                : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onOpenDetails(service)}
                                        className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                        title="Szczegóły usługi"
                                        aria-label="Szczegóły usługi"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onManageVariants(service)
                                        }
                                        className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                        title="Warianty usługi"
                                        aria-label="Zarządzaj wariantami"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 6h16M4 12h16M4 18h7"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onEdit(service)}
                                        className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                        title="Edytuj usługę"
                                        aria-label="Edytuj usługę"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    `Czy na pewno chcesz usunąć usługę "${service.name}"?`,
                                                )
                                            ) {
                                                void onDelete(service.id);
                                            }
                                        }}
                                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Usuń usługę"
                                        aria-label="Usuń usługę"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
