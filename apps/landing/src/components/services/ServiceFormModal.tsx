'use client';

import { useState, useEffect } from 'react';
import type { Service, ServiceCategory, PriceType } from '@/types';

interface Props {
    isOpen: boolean;
    service: Service | null;
    categories: ServiceCategory[];
    onClose: () => void;
    onSave: (data: ServiceFormData) => void;
}

export interface ServiceFormData {
    name: string;
    description: string;
    duration: number;
    price: number;
    priceType: PriceType;
    categoryId: number | undefined;
    commissionPercent: number | undefined;
    isActive: boolean;
    onlineBooking: boolean;
}

const DURATION_OPTIONS = [
    15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240,
];

export default function ServiceFormModal({
    isOpen,
    service,
    categories,
    onClose,
    onSave,
}: Props) {
    const [formData, setFormData] = useState<ServiceFormData>({
        name: '',
        description: '',
        duration: 60,
        price: 0,
        priceType: 'fixed',
        categoryId: undefined,
        commissionPercent: undefined,
        isActive: true,
        onlineBooking: true,
    });

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name,
                description: service.description || '',
                duration: service.duration,
                price: service.price,
                priceType: service.priceType,
                categoryId: service.categoryId,
                commissionPercent: service.commissionPercent,
                isActive: service.isActive,
                onlineBooking: service.onlineBooking,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                duration: 60,
                price: 0,
                priceType: 'fixed',
                categoryId: undefined,
                commissionPercent: undefined,
                isActive: true,
                onlineBooking: true,
            });
        }
    }, [service, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const flattenCategories = (
        cats: ServiceCategory[],
        level = 0,
    ): Array<{ id: number; name: string; level: number }> => {
        const result: Array<{ id: number; name: string; level: number }> = [];
        for (const cat of cats) {
            result.push({ id: cat.id, name: cat.name, level });
            if (cat.children) {
                result.push(...flattenCategories(cat.children, level + 1));
            }
        }
        return result;
    };

    const flatCategories = flattenCategories(categories);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {service ? 'Edytuj usługę' : 'Nowa usługa'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        aria-label="Zamknij"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="service-name"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Nazwa usługi *
                            </label>
                            <input
                                id="service-name"
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="service-description"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Opis
                            </label>
                            <textarea
                                id="service-description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="service-category"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Kategoria
                            </label>
                            <select
                                id="service-category"
                                value={formData.categoryId || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        categoryId: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Bez kategorii</option>
                                {flatCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {'—'.repeat(cat.level)} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Duration & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="service-duration"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Czas trwania *
                            </label>
                            <select
                                id="service-duration"
                                value={formData.duration}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        duration: Number(e.target.value),
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                {DURATION_OPTIONS.map((d) => (
                                    <option key={d} value={d}>
                                        {d < 60
                                            ? `${d} min`
                                            : d % 60 === 0
                                              ? `${d / 60} godz.`
                                              : `${Math.floor(d / 60)} godz. ${d % 60} min`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="service-price"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Cena (PLN) *
                            </label>
                            <div className="relative">
                                <input
                                    id="service-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-16"
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                    PLN
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="service-pricetype"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Typ ceny
                            </label>
                            <select
                                id="service-pricetype"
                                value={formData.priceType}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        priceType: e.target.value as PriceType,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="fixed">Stała</option>
                                <option value="from">Od (minimalna)</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="service-commission"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Prowizja (%)
                            </label>
                            <input
                                id="service-commission"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.commissionPercent || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        commissionPercent: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Domyślna"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-8 pt-4 border-t">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    setFormData({ ...formData, isActive: e.target.checked })
                                }
                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Usługa aktywna
                            </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.onlineBooking}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        onlineBooking: e.target.checked,
                                    })
                                }
                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Dostępna w rezerwacjach online
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                        >
                            {service ? 'Zapisz zmiany' : 'Dodaj usługę'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
