'use client';

import { useState, useEffect } from 'react';
import type { Service, ServiceVariant, PriceType } from '@/types';
import {
    useServiceVariants,
    useCreateServiceVariant,
    useUpdateServiceVariant,
    useDeleteServiceVariant,
} from '@/hooks/useServicesAdmin';

interface ServiceVariantsModalProps {
    isOpen: boolean;
    service: Service | null;
    onClose: () => void;
}

interface VariantFormData {
    name: string;
    description?: string;
    duration: number;
    price: number;
    priceType: PriceType;
}

const defaultFormData: VariantFormData = {
    name: '',
    description: '',
    duration: 30,
    price: 0,
    priceType: 'fixed',
};

export default function ServiceVariantsModal({
    isOpen,
    service,
    onClose,
}: ServiceVariantsModalProps) {
    const [editingVariant, setEditingVariant] = useState<ServiceVariant | null>(null);
    const [formData, setFormData] = useState<VariantFormData>(defaultFormData);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const { data: variants = [], isLoading } = useServiceVariants(service?.id ?? null);
    const createVariant = useCreateServiceVariant();
    const updateVariant = useUpdateServiceVariant();
    const deleteVariant = useDeleteServiceVariant();

    useEffect(() => {
        if (!isOpen) {
            setEditingVariant(null);
            setFormData(defaultFormData);
            setIsFormVisible(false);
        }
    }, [isOpen]);

    const handleOpenForm = (variant?: ServiceVariant) => {
        if (variant) {
            setEditingVariant(variant);
            setFormData({
                name: variant.name,
                description: variant.description || '',
                duration: variant.duration,
                price: variant.price,
                priceType: variant.priceType,
            });
        } else {
            setEditingVariant(null);
            setFormData(defaultFormData);
        }
        setIsFormVisible(true);
    };

    const handleCancelForm = () => {
        setEditingVariant(null);
        setFormData(defaultFormData);
        setIsFormVisible(false);
    };

    const handleSaveVariant = async () => {
        if (!service) return;

        if (editingVariant) {
            await updateVariant.mutateAsync({
                serviceId: service.id,
                variantId: editingVariant.id,
                data: formData,
            });
        } else {
            await createVariant.mutateAsync({
                serviceId: service.id,
                data: formData,
            });
        }
        handleCancelForm();
    };

    const handleDeleteVariant = async (variantId: number) => {
        if (!service) return;
        if (window.confirm('Czy na pewno chcesz usunąć ten wariant?')) {
            await deleteVariant.mutateAsync({ serviceId: service.id, variantId });
        }
    };

    if (!isOpen || !service) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Warianty usługi
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {service.name}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
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

                    {/* Content */}
                    <div className="p-4">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : (
                            <>
                                {/* Variants list */}
                                {!isFormVisible && (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm text-gray-600">
                                                {variants.length} wariant
                                                {variants.length !== 1 && 'ów'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenForm()}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                    />
                                                </svg>
                                                Dodaj wariant
                                            </button>
                                        </div>

                                        {variants.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>Brak wariantów</p>
                                                <p className="text-sm">
                                                    Dodaj warianty, aby oferować różne wersje tej
                                                    usługi
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {variants.map((variant) => (
                                                    <div
                                                        key={variant.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">
                                                                {variant.name}
                                                            </div>
                                                            {variant.description && (
                                                                <div className="text-sm text-gray-500">
                                                                    {variant.description}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                                                <span>{variant.duration} min</span>
                                                                <span>
                                                                    {variant.priceType === 'from'
                                                                        ? 'od '
                                                                        : ''}
                                                                    {variant.price.toFixed(2)} zł
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenForm(variant)}
                                                                className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-white transition-colors"
                                                                title="Edytuj"
                                                            >
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteVariant(variant.id)
                                                                }
                                                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                                                                title="Usuń"
                                                            >
                                                                <svg
                                                                    className="w-4 h-4"
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
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Variant form */}
                                {isFormVisible && (
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-gray-900">
                                            {editingVariant ? 'Edytuj wariant' : 'Nowy wariant'}
                                        </h3>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nazwa wariantu *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="np. Krótkie włosy, Długie włosy"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Opis (opcjonalnie)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.description || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        description: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Czas trwania (min) *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.duration}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            duration: parseInt(e.target.value) || 0,
                                                        })
                                                    }
                                                    min={5}
                                                    step={5}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cena (zł) *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            price: parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                    min={0}
                                                    step={0.01}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Typ ceny
                                            </label>
                                            <select
                                                value={formData.priceType}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        priceType: e.target.value as PriceType,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="fixed">Stała cena</option>
                                                <option value="from">Cena od</option>
                                                <option value="free">Bezpłatna</option>
                                            </select>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={handleCancelForm}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Anuluj
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveVariant}
                                                disabled={
                                                    !formData.name ||
                                                    createVariant.isPending ||
                                                    updateVariant.isPending
                                                }
                                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {editingVariant ? 'Zapisz zmiany' : 'Dodaj wariant'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {!isFormVisible && (
                        <div className="flex justify-end p-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Zamknij
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
