import { useState, type CSSProperties } from 'react';
import type { ServiceCategory } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import PanelButton from '@/components/ui/PanelButton';

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
    const [confirmDeleteCategory, setConfirmDeleteCategory] =
        useState<ServiceCategory | null>(null);

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
        const rowStyle = {
            '--category-level': level,
        } as CSSProperties;
        const colorStyle = {
            '--category-color': category.color ?? '#6e7278',
        } as CSSProperties;

        return (
            <div key={category.id}>
                <div
                    className={`service-category-tree__row${isSelected ? ' is-selected' : ''}`}
                    style={rowStyle}
                    onClick={() => onSelectCategory(category.id)}
                >
                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(category.id);
                            }}
                            className="service-category-tree__expand"
                            aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                            aria-expanded={isExpanded}
                        >
                            <svg
                                className={
                                    isExpanded
                                        ? 'service-category-tree__chevron is-expanded'
                                        : 'service-category-tree__chevron'
                                }
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
                    {!hasChildren && (
                        <span
                            className="service-category-tree__expand-placeholder"
                            aria-hidden
                        />
                    )}

                    {category.color && (
                        <span
                            className="service-category-tree__dot"
                            style={colorStyle}
                        />
                    )}

                    <span className="service-category-tree__name">
                        {category.name}
                    </span>

                    {category.services && (
                        <span className="service-category-tree__count">
                            ({category.services.length})
                        </span>
                    )}

                    <div className="service-category-tree__actions">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                void onEditCategory(category);
                            }}
                            className="service-category-tree__action"
                            title="Edytuj kategorię"
                            aria-label="Edytuj kategorię"
                        >
                            <svg
                                aria-hidden
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
                            className="service-category-tree__action"
                            title="Dodaj podkategorię"
                            aria-label="Dodaj podkategorię"
                        >
                            <svg
                                aria-hidden
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
                                setConfirmDeleteCategory(category);
                            }}
                            className="service-category-tree__action"
                            title="Usuń kategorię"
                            aria-label="Usuń kategorię"
                        >
                            <svg
                                aria-hidden
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
        <div className="service-category-tree">
            <div className="service-category-tree__header">
                <h3>Kategorie</h3>
                <PanelButton
                    type="button"
                    onClick={() => onAddCategory()}
                    size="sm"
                    variant="secondary"
                >
                    Dodaj
                </PanelButton>
            </div>

            <div>
                <div
                    className={`service-category-tree__row service-category-tree__row--system${selectedCategoryId === null ? ' is-selected' : ''}`}
                    onClick={() => onSelectCategory(null)}
                >
                    <svg
                        className="service-category-tree__system-icon"
                        aria-hidden
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
                    <span className="service-category-tree__name">
                        Wszystkie usługi
                    </span>
                </div>

                {categories.map((category) => renderCategory(category))}

                <div
                    className={`service-category-tree__row service-category-tree__row--system${selectedCategoryId === -1 ? ' is-selected' : ''}`}
                    onClick={() => onSelectCategory(-1)}
                >
                    <svg
                        className="service-category-tree__system-icon"
                        aria-hidden
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
                    <span className="service-category-tree__name">
                        Bez kategorii
                    </span>
                </div>
            </div>
            <ConfirmModal
                open={!!confirmDeleteCategory}
                title="Usuń kategorię"
                message={`Czy na pewno chcesz usunąć kategorię "${confirmDeleteCategory?.name}"?`}
                confirmLabel="Usuń"
                confirmVariant="danger"
                onConfirm={() => {
                    if (!confirmDeleteCategory) return;
                    const id = confirmDeleteCategory.id;
                    setConfirmDeleteCategory(null);
                    void onDeleteCategory(id);
                }}
                onCancel={() => setConfirmDeleteCategory(null)}
            />
        </div>
    );
}
