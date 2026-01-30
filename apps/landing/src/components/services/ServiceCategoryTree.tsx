'use client';

import { useState } from 'react';
import type { ServiceCategory } from '@/types';

interface Props {
    categories: ServiceCategory[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
    onEditCategory: (category: ServiceCategory) => void;
    onDeleteCategory: (id: number) => void;
    onAddCategory: (parentId?: number) => void;
}

export default function ServiceCategoryTree({
    categories,
    selectedCategoryId,
    onSelectCategory,
    onEditCategory,
    onDeleteCategory,
    onAddCategory,
}: Props) {
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const toggleExpanded = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const renderCategory = (category: ServiceCategory, level = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category.id);
        const isSelected = selectedCategoryId === category.id;

        return (
            <div key={category.id}>
                <div
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                        isSelected
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-gray-100'
                    }`}
                    style={{ paddingLeft: `${12 + level * 16}px` }}
                    onClick={() => onSelectCategory(category.id)}
                >
                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(category.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                        >
                            <svg
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    )}
                    {!hasChildren && <div className="w-6" />}

                    {category.color && (
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                        />
                    )}

                    <span className="flex-1 truncate font-medium">
                        {category.name}
                    </span>

                    {category.services && (
                        <span className="text-xs text-gray-500">
                            ({category.services.length})
                        </span>
                    )}

                    <div className="hidden group-hover:flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditCategory(category);
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                            title="Edytuj kategorię"
                            aria-label="Edytuj kategorię"
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
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddCategory(category.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                            title="Dodaj podkategorię"
                            aria-label="Dodaj podkategorię"
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
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (
                                    confirm(
                                        `Czy na pewno chcesz usunąć kategorię "${category.name}"?`,
                                    )
                                ) {
                                    onDeleteCategory(category.id);
                                }
                            }}
                            className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                            title="Usuń kategorię"
                            aria-label="Usuń kategorię"
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

                {hasChildren && isExpanded && (
                    <div>
                        {category.children!.map((child) =>
                            renderCategory(child, level + 1),
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Kategorie</h3>
                <button
                    type="button"
                    onClick={() => onAddCategory()}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    + Dodaj
                </button>
            </div>

            <div className="space-y-1">
                <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                        selectedCategoryId === null
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onSelectCategory(null)}
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
                            d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                    </svg>
                    <span className="font-medium">Wszystkie usługi</span>
                </div>

                {categories.map((category) => renderCategory(category))}

                <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                        selectedCategoryId === -1
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    onClick={() => onSelectCategory(-1)}
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
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                    </svg>
                    <span className="font-medium">Bez kategorii</span>
                </div>
            </div>
        </div>
    );
}
