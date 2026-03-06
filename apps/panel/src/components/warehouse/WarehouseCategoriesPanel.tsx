'use client';

import type { ProductCategory } from '@/types';

interface WarehouseCategoriesPanelProps {
    categories: ProductCategory[];
    selectedCategoryId?: number;
    onSelect: (categoryId?: number) => void;
}

export default function WarehouseCategoriesPanel({
    categories,
    selectedCategoryId,
    onSelect,
}: WarehouseCategoriesPanelProps) {
    const renderNode = (category: ProductCategory, depth = 0) => {
        const isSelected = selectedCategoryId === category.id;
        return (
            <div key={category.id}>
                <button
                    type="button"
                    className={`w-full text-left text-sm ${
                        depth === 0
                            ? 'pl-2'
                            : depth === 1
                              ? 'pl-6'
                              : depth === 2
                                ? 'pl-10'
                                : depth === 3
                                  ? 'pl-14'
                                  : 'pl-20'
                    } ${
                        isSelected
                            ? 'font-semibold text-sky-600'
                            : 'text-gray-700'
                    }`}
                    onClick={() => onSelect(category.id)}
                >
                    {category.name}
                </button>
                {category.children?.map((child) =>
                    renderNode(child, depth + 1),
                )}
            </div>
        );
    };

    return (
        <div className="space-y-2 pt-2">
            <button
                type="button"
                className={`w-full rounded border px-2 py-1 text-left text-sm ${
                    !selectedCategoryId
                        ? 'border-sky-400 bg-sky-50 font-semibold text-sky-600'
                        : 'border-gray-200 text-gray-700'
                }`}
                onClick={() => onSelect(undefined)}
            >
                Wszystkie produkty
            </button>
            <div className="space-y-1">
                {categories.map((category) => renderNode(category))}
            </div>
        </div>
    );
}
