'use client';

import { useState } from 'react';
import type { ServiceCategory } from '@/types';
import CategoryFormModal from './CategoryFormModal';
import {
    useCreateServiceCategory,
    useUpdateServiceCategory,
    useDeleteServiceCategory,
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

    const createCategory = useCreateServiceCategory();
    const updateCategory = useUpdateServiceCategory();
    const deleteCategory = useDeleteServiceCategory();

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

    const handleSave = async (data: any) => {
        if (editingCategory) {
            await updateCategory.mutateAsync({
                id: editingCategory.id,
                ...data,
            });
        } else {
            await createCategory.mutateAsync(data);
        }
        setIsFormOpen(false);
    };

    const handleDelete = async (id: number, name: string) => {
        if (confirm(`Czy na pewno chcesz usunąć kategorię "${name}"?`)) {
            await deleteCategory.mutateAsync(id);
        }
    };

    const renderCategoryRow = (category: ServiceCategory, level = 0) => {
        const rowStyle = {
            '--dynamic-padding': `${20 + level * 20}px`,
        } as React.CSSProperties;
        const dotStyle = {
            '--dynamic-color': category.color,
        } as React.CSSProperties;

        return (
            <div key={category.id}>
                {/* eslint-disable-next-line */}
                <div
                    className="versum-list-item flex-between pl-dynamic"
                    style={rowStyle}
                >
                    <div className="flex-center gap-10">
                        {category.color && (
                            // eslint-disable-next-line
                            <span
                                className="status-dot w-10 h-10 bg-dynamic"
                                style={dotStyle}
                            />
                        )}
                        <span className={level === 0 ? 'fw-600' : ''}>
                            {category.name}
                        </span>
                    </div>
                    <div className="btn-group">
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() => handleEdit(category)}
                            title="Edytuj kategorię"
                            aria-label="Edytuj kategorię"
                        >
                            <i className="fa fa-pencil"></i>
                        </button>
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() => handleAdd(category.id)}
                            title="Dodaj podkategorię"
                            aria-label="Dodaj podkategorię"
                        >
                            <i className="fa fa-plus"></i>
                        </button>
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() =>
                                handleDelete(category.id, category.name)
                            }
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
        <div className="modal fade in block bg-modal-overlay">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                        >
                            &times;
                        </button>
                        <h4 className="modal-title">Zarządzaj kategoriami</h4>
                    </div>
                    <div className="modal-body p-0">
                        <div className="versum-list">
                            <div className="versum-list-item flex-between bg-f9 fw-600">
                                <span>Nazwa kategorii</span>
                                <span>Akcje</span>
                            </div>
                            <div className="h-400 overflow-y-auto">
                                {categories.length > 0 ? (
                                    categories.map((cat) =>
                                        renderCategoryRow(cat),
                                    )
                                ) : (
                                    <div className="p-4 text-center versum-muted">
                                        Brak zdefiniowanych kategorii
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            className="btn btn-default pull-left"
                            onClick={() => handleAdd(null)}
                        >
                            <i className="fa fa-plus mr-6"></i>
                            Dodaj kategorię główną
                        </button>
                        <button className="btn btn-primary" onClick={onClose}>
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
        </div>
    );
}
