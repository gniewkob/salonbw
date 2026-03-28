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
                    className={`w-100 text-start small ${
                        depth === 0
                            ? 'ps-2'
                            : depth === 1
                              ? 'ps-4'
                              : depth === 2
                                ? 'pl-10'
                                : depth === 3
                                  ? 'pl-14'
                                  : 'pl-20'
                    } ${isSelected ? 'fw-semibold text-sky-600' : 'text-body'}`}
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
        <div className="gap-2 pt-2">
            <button
                type="button"
                className={`w-100 rounded border px-2 py-1 text-start small ${
                    !selectedCategoryId
                        ? 'border-sky-400 bg-sky-50 fw-semibold text-sky-600'
                        : 'border-secondary border-opacity-25 text-body'
                }`}
                onClick={() => onSelect(undefined)}
            >
                Wszystkie produkty
            </button>
            <div className="gap-1">
                {categories.map((category) => renderNode(category))}
            </div>
        </div>
    );
}
