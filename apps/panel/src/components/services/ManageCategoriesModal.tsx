import { useState } from 'react';
import type { ServiceCategory } from '@/types';
import CategoryFormModal from './CategoryFormModal';
import ConfirmModal from '@/components/ConfirmModal';
import {
    type CreateServiceCategoryDto,
    useCreateServiceCategory,
    useUpdateServiceCategory,
    useDeleteServiceCategory,
    useReorderCategories,
} from '@/hooks/useServicesAdmin';

interface Props {
    isOpen: boolean;
    categories: ServiceCategory[];
    onClose: () => void;
}

export default function ManageCategoriesModal({
    isOpen,
    categories,
    onClose,
}: Props) {
    const [editingCategory, setEditingCategory] =
        useState<ServiceCategory | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [parentId, setParentId] = useState<number | null>(null);
    const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const createCategory = useCreateServiceCategory();
    const updateCategory = useUpdateServiceCategory();
    const deleteCategory = useDeleteServiceCategory();
    const reorderCategories = useReorderCategories();

    // Move a top-level category up/down and persist the new order. Backend
    // reorder sets sortOrder by array position (verified live: 200).
    const moveCategory = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= categories.length) return;
        const ordered = categories.map((c) => c.id);
        [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
        void reorderCategories.mutateAsync(ordered).catch(() => {
            // error handled by hook
        });
    };

    const handleEdit = (category: ServiceCategory) => {
        setEditingCategory(category);
        setParentId(null);
        setIsFormOpen(true);
    };

    const handleAdd = (pId: number | null = null) => {
        setEditingCategory(null);
        setParentId(pId);
        setIsFormOpen(true);
    };

    const handleSave = async (data: CreateServiceCategoryDto) => {
        try {
            if (editingCategory) {
                await updateCategory.mutateAsync({
                    id: editingCategory.id,
                    data,
                });
            } else {
                await createCategory.mutateAsync(data);
            }
            setIsFormOpen(false);
        } catch {
            // error handled by hook
        }
    };

    const handleDelete = (id: number, name: string) => {
        setConfirmDeleteCategory({ id, name });
    };

    const renderCategoryRow = (
        category: ServiceCategory,
        level = 0,
        index = 0,
        siblingsCount = 1,
    ) => {
        const rowStyle = {
            '--dynamic-padding': `${20 + level * 20}px`,
        } as React.CSSProperties;
        const dotStyle = {
            '--dynamic-color': category.color,
        } as React.CSSProperties;
        const isTopLevel = level === 0;

        return (
            <div key={category.id}>
                <div
                    className="salonbw-list-item flex-between pl-dynamic"
                    style={rowStyle}
                >
                    <div className="d-flex align-items-center gap-3">
                        {category.color && (
                            <span
                                className="status-dot w-10 h-10 bg-dynamic"
                                style={dotStyle}
                            />
                        )}
                        <div>
                            <span className={isTopLevel ? 'fw-600' : ''}>
                                {category.name}
                            </span>
                            {category.description && (
                                <div className="text-muted small">
                                    {category.description}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="btn-group">
                        {isTopLevel && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => moveCategory(index, -1)}
                                    disabled={
                                        index === 0 ||
                                        reorderCategories.isPending
                                    }
                                    title="Przesuń wyżej"
                                    aria-label="Przesuń kategorię wyżej"
                                >
                                    <i className="fa fa-arrow-up"></i>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => moveCategory(index, 1)}
                                    disabled={
                                        index === siblingsCount - 1 ||
                                        reorderCategories.isPending
                                    }
                                    title="Przesuń niżej"
                                    aria-label="Przesuń kategorię niżej"
                                >
                                    <i className="fa fa-arrow-down"></i>
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleEdit(category)}
                            title="Edytuj kategorię"
                            aria-label="Edytuj kategorię"
                        >
                            <i className="fa fa-pencil"></i>
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleAdd(category.id)}
                            title="Dodaj podkategorię"
                            aria-label="Dodaj podkategorię"
                        >
                            <i className="fa fa-plus"></i>
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                void handleDelete(category.id, category.name);
                            }}
                            title="Usuń kategorię"
                            aria-label="Usuń kategorię"
                        >
                            <i className="fa fa-trash text-danger"></i>
                        </button>
                    </div>
                </div>
                {category.children &&
                    category.children.map((child) =>
                        renderCategoryRow(child, level + 1),
                    )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal bg-modal-overlay"
            style={{ display: 'block', opacity: 1 }}
        >
            <div
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Zarządzaj kategoriami usług"
            >
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">Zarządzaj kategoriami</h4>
                    </div>
                    <div className="modal-body p-0">
                        <div className="salonbw-list">
                            <div className="salonbw-list-item flex-between bg-f9 fw-600">
                                <span>Nazwa kategorii</span>
                                <span>Akcje</span>
                            </div>
                            <div
                                className="overflow-auto"
                                style={{ maxHeight: 400 }}
                            >
                                {categories.length > 0 ? (
                                    categories.map((cat, i) =>
                                        renderCategoryRow(
                                            cat,
                                            0,
                                            i,
                                            categories.length,
                                        ),
                                    )
                                ) : (
                                    <div className="p-4 text-center text-muted">
                                        Brak zdefiniowanych kategorii
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary float-start"
                            onClick={() => handleAdd(null)}
                        >
                            <i className="fa fa-plus me-2"></i>
                            Dodaj kategorię główną
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onClose}
                        >
                            Gotowe
                        </button>
                    </div>
                </div>
            </div>

            <CategoryFormModal
                isOpen={isFormOpen}
                category={editingCategory}
                parentId={parentId}
                categories={categories}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
            />
            <ConfirmModal
                open={!!confirmDeleteCategory}
                title="Usuń kategorię"
                message={`Czy na pewno chcesz usunąć kategorię "${confirmDeleteCategory?.name}"?`}
                confirmLabel="Usuń"
                confirmVariant="danger"
                onConfirm={() => {
                    if (!confirmDeleteCategory) return;
                    const { id } = confirmDeleteCategory;
                    setConfirmDeleteCategory(null);
                    void deleteCategory.mutateAsync(id).catch(() => {
                        // error handled by hook
                    });
                }}
                onCancel={() => setConfirmDeleteCategory(null)}
            />
        </div>
    );
}
