'use client';

import { useState } from 'react';
import type { ServiceCategory } from '@/types';

interface Props {
    categories: ServiceCategory[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
    onEditCategory: (category: ServiceCategory) => Promise<void> | void;
    onDeleteCategory: (id: number) => Promise<void> | void;
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
    const [hoveredId, setHoveredId] = useState<number | null>(null);

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
        const isHovered = hoveredId === category.id;
        const rowStyle = { paddingLeft: `${12 + level * 16}px` };
        const colorStyle = category.color
            ? { backgroundColor: category.color }
            : undefined;

        return (
            <div key={category.id}>
                <div
                    className={`d-flex align-items-center gap-2 rounded-3 px-3 py-2 ${
                        isSelected
                            ? 'bg-primary bg-opacity-10 text-primary'
                            : 'text-body'
                    }`}
                    style={{
                        ...rowStyle,
                        cursor: 'pointer',
                        backgroundColor:
                            !isSelected && isHovered ? '#f3f4f6' : undefined,
                    }}
                    onClick={() => onSelectCategory(category.id)}
                    onMouseEnter={() => setHoveredId(category.id)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(category.id);
                            }}
                            className="p-1 rounded"
                            aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                        >
                            <svg
                                style={{
                                    width: 16,
                                    height: 16,
                                    transition: 'transform 0.15s',
                                    transform: isExpanded
                                        ? 'rotate(90deg)'
                                        : 'none',
                                }}
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
                    {!hasChildren && <div style={{ width: 24 }} />}

                    {category.color && (
                        <span
                            className="rounded-circle flex-shrink-0"
                            style={{
                                ...colorStyle,
                                width: 12,
                                height: 12,
                                display: 'inline-block',
                            }}
                        />
                    )}

                    <span className="flex-fill text-truncate fw-medium">
                        {category.name}
                    </span>

                    {category.services && (
                        <span className="small text-muted">
                            ({category.services.length})
                        </span>
                    )}

                    <div
                        className={`d-flex align-items-center gap-1 ${isHovered ? '' : 'd-none'}`}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                void onEditCategory(category);
                            }}
                            className="p-1 rounded text-muted"
                            title="Edytuj kategorię"
                            aria-label="Edytuj kategorię"
                        >
                            <svg
                                style={{ width: 16, height: 16 }}
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
                            className="p-1 rounded text-muted"
                            title="Dodaj podkategorię"
                            aria-label="Dodaj podkategorię"
                        >
                            <svg
                                style={{ width: 16, height: 16 }}
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
                                    void onDeleteCategory(category.id);
                                }
                            }}
                            className="p-1 rounded text-muted"
                            title="Usuń kategorię"
                            aria-label="Usuń kategorię"
                        >
                            <svg
                                style={{ width: 16, height: 16 }}
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
        <div className="bg-white rounded-3 shadow-sm border p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 className="fw-semibold text-dark mb-0">Kategorie</h3>
                <button
                    type="button"
                    onClick={() => onAddCategory()}
                    className="small text-primary fw-medium btn btn-link p-0"
                >
                    + Dodaj
                </button>
            </div>

            <div>
                <div
                    className={`d-flex align-items-center gap-2 rounded-3 px-3 py-2 ${
                        selectedCategoryId === null
                            ? 'bg-primary bg-opacity-10 text-primary'
                            : 'text-body'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectCategory(null)}
                >
                    <svg
                        style={{ width: 20, height: 20 }}
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
                    <span className="fw-medium">Wszystkie usługi</span>
                </div>

                {categories.map((category) => renderCategory(category))}

                <div
                    className={`d-flex align-items-center gap-2 rounded-3 px-3 py-2 ${
                        selectedCategoryId === -1
                            ? 'bg-primary bg-opacity-10 text-primary'
                            : 'text-muted'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectCategory(-1)}
                >
                    <svg
                        style={{ width: 20, height: 20 }}
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
                    <span className="fw-medium">Bez kategorii</span>
                </div>
            </div>
        </div>
    );
}
