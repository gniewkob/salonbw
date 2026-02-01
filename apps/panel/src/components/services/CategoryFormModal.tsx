'use client';

import { useState, useEffect } from 'react';
import type { ServiceCategory } from '@/types';

interface Props {
    isOpen: boolean;
    category: ServiceCategory | null;
    parentId: number | null;
    categories: ServiceCategory[];
    onClose: () => void;
    onSave: (data: CategoryFormData) => Promise<void> | void;
}

export interface CategoryFormData {
    name: string;
    description: string;
    color: string;
    parentId: number | undefined;
    isActive: boolean;
}

const COLOR_OPTIONS = [
    '#25B4C1', // Primary teal
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#6B7280', // Gray
];

export default function CategoryFormModal({
    isOpen,
    category,
    parentId,
    categories,
    onClose,
    onSave,
}: Props) {
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        description: '',
        color: COLOR_OPTIONS[0],
        parentId: undefined,
        isActive: true,
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || '',
                color: category.color || COLOR_OPTIONS[0],
                parentId: category.parentId,
                isActive: category.isActive,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                color: COLOR_OPTIONS[0],
                parentId: parentId || undefined,
                isActive: true,
            });
        }
    }, [category, parentId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void onSave(formData);
    };

    const flattenCategories = (
        cats: ServiceCategory[],
        level = 0,
        excludeId?: number,
    ): Array<{ id: number; name: string; level: number }> => {
        const result: Array<{ id: number; name: string; level: number }> = [];
        for (const cat of cats) {
            if (cat.id !== excludeId) {
                result.push({ id: cat.id, name: cat.name, level });
                if (cat.children) {
                    result.push(
                        ...flattenCategories(
                            cat.children,
                            level + 1,
                            excludeId,
                        ),
                    );
                }
            }
        }
        return result;
    };

    const flatCategories = flattenCategories(categories, 0, category?.id);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {category ? 'Edytuj kategorię' : 'Nowa kategoria'}
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

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label
                            htmlFor="cat-name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Nazwa kategorii *
                        </label>
                        <input
                            id="cat-name"
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="cat-description"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Opis
                        </label>
                        <textarea
                            id="cat-description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="cat-parent"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Kategoria nadrzędna
                        </label>
                        <select
                            id="cat-parent"
                            value={formData.parentId || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    parentId: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Brak (kategoria główna)</option>
                            {flatCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {'—'.repeat(cat.level)} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kolor
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        setFormData({ ...formData, color })
                                    }
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                                        formData.color === color
                                            ? 'border-gray-800 scale-110'
                                            : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Wybierz kolor ${color}`}
                                />
                            ))}
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        color: e.target.value,
                                    })
                                }
                                className="w-8 h-8 rounded cursor-pointer"
                                title="Wybierz własny kolor"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer pt-2">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    isActive: e.target.checked,
                                })
                            }
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Kategoria aktywna
                        </span>
                    </label>

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
                            {category ? 'Zapisz zmiany' : 'Dodaj kategorię'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
