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
        return (
            <div key={category.id}>
                <div
                    className="versum-list-item flex-between"
                    style={{
                        paddingLeft: `${20 + level * 20}px`,
                        borderBottom: '1px solid #eee',
                    }}
                >
                    <div className="flex-center" style={{ gap: '10px' }}>
                        {category.color && (
                            <span
                                className="status-dot"
                                style={{
                                    backgroundColor: category.color,
                                    width: '10px',
                                    height: '10px',
                                }}
                            />
                        )}
                        <span style={{ fontWeight: level === 0 ? 600 : 400 }}>
                            {category.name}
                        </span>
                    </div>
                    <div className="btn-group">
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() => handleEdit(category)}
                        >
                            <i className="fa fa-pencil"></i>
                        </button>
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() => handleAdd(category.id)}
                            title="Dodaj podkategorię"
                        >
                            <i className="fa fa-plus"></i>
                        </button>
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() =>
                                handleDelete(category.id, category.name)
                            }
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
            className="modal fade in"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
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
                    <div className="modal-body" style={{ padding: 0 }}>
                        <div className="versum-list">
                            <div
                                className="versum-list-item flex-between"
                                style={{
                                    backgroundColor: '#f9f9f9',
                                    fontWeight: 600,
                                }}
                            >
                                <span>Nazwa kategorii</span>
                                <span>Akcje</span>
                            </div>
                            <div
                                style={{
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                }}
                            >
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
                            <i
                                className="fa fa-plus"
                                style={{ marginRight: '6px' }}
                            ></i>
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
