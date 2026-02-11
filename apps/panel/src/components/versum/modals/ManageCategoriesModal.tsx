'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
    useCreateProductCategory,
    useDeleteProductCategory,
    useProductCategories,
    useUpdateProductCategory,
} from '@/hooks/useWarehouseViews';
import type { ProductCategory } from '@/types';

interface Props {
    type: 'service' | 'product';
    onClose: () => void;
}

type CategoryDraft = {
    id: number;
    name: string;
    parentId?: number;
    sortOrder: number;
    isActive: boolean;
};

function flattenCategories(
    nodes: ProductCategory[],
    depth = 0,
): Array<{ id: number; name: string; depth: number }> {
    const result: Array<{ id: number; name: string; depth: number }> = [];
    for (const node of nodes) {
        result.push({ id: node.id, name: node.name, depth });
        if (node.children?.length) {
            result.push(...flattenCategories(node.children, depth + 1));
        }
    }
    return result;
}

function toDrafts(nodes: ProductCategory[]): CategoryDraft[] {
    const flat = flattenCategories(nodes);
    const byId = new Map<number, ProductCategory>();
    const collect = (items: ProductCategory[]) => {
        for (const item of items) {
            byId.set(item.id, item);
            if (item.children?.length) collect(item.children);
        }
    };
    collect(nodes);

    return flat.map((item) => {
        const source = byId.get(item.id)!;
        return {
            id: source.id,
            name: source.name,
            parentId: source.parentId ?? undefined,
            sortOrder: source.sortOrder ?? 0,
            isActive: source.isActive ?? true,
        };
    });
}

export default function ManageCategoriesModal({ type, onClose }: Props) {
    if (type === 'service') {
        return (
            <div className="modal-backdrop fade in" onClick={onClose}>
                <div
                    className="modal-dialog"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                Zarządzaj kategoriami (Usługi)
                            </h4>
                            <button
                                type="button"
                                className="close"
                                onClick={onClose}
                                aria-label="Zamknij"
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            Zarządzanie kategoriami usług jest obsługiwane w
                            module Usługi.
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-default btn-xs"
                                onClick={onClose}
                            >
                                zamknij
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <ManageProductCategoriesModal onClose={onClose} />;
}

function ManageProductCategoriesModal({ onClose }: { onClose: () => void }) {
    const { data: tree = [], isLoading } = useProductCategories();
    const createCategory = useCreateProductCategory();
    const updateCategory = useUpdateProductCategory();
    const deleteCategory = useDeleteProductCategory();

    const [newName, setNewName] = useState('');
    const [newParentId, setNewParentId] = useState<number | undefined>(
        undefined,
    );

    const flatTree = useMemo(() => flattenCategories(tree), [tree]);
    const drafts = useMemo(() => toDrafts(tree), [tree]);
    const isBusy =
        createCategory.isPending ||
        updateCategory.isPending ||
        deleteCategory.isPending;

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = newName.trim();
        if (!name) return;
        await createCategory.mutateAsync({
            name,
            parentId: newParentId,
            sortOrder: 0,
            isActive: true,
        });
        setNewName('');
        setNewParentId(undefined);
    };

    const handleUpdate = async (draft: CategoryDraft) => {
        const payload: {
            name?: string;
            parentId?: number;
            sortOrder?: number;
            isActive?: boolean;
        } = {
            name: draft.name.trim(),
            sortOrder: Number(draft.sortOrder || 0),
            isActive: draft.isActive,
        };
        if (draft.parentId && draft.parentId > 0) {
            payload.parentId = draft.parentId;
        }
        await updateCategory.mutateAsync({
            id: draft.id,
            payload,
        });
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Usunąć kategorię "${name}"?`)) return;
        await deleteCategory.mutateAsync(id);
    };

    return (
        <div className="modal-backdrop fade in" onClick={onClose}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">
                            Zarządzaj kategoriami (Produkty)
                        </h4>
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div className="modal-body modal-body-scroll">
                        <form onSubmit={(e) => void handleCreate(e)}>
                            <div className="form-group">
                                <label
                                    className="control-label"
                                    htmlFor="new_category_name"
                                >
                                    Dodaj kategorię
                                </label>
                                <input
                                    id="new_category_name"
                                    className="form-control"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="np. Color Touch"
                                    disabled={isBusy}
                                />
                            </div>
                            <div className="form-group">
                                <label
                                    className="control-label"
                                    htmlFor="new_category_parent"
                                >
                                    Kategoria nadrzędna
                                </label>
                                <select
                                    id="new_category_parent"
                                    className="form-control"
                                    value={newParentId ?? ''}
                                    onChange={(e) =>
                                        setNewParentId(
                                            e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        )
                                    }
                                    disabled={isBusy}
                                >
                                    <option value="">(główna)</option>
                                    {flatTree.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {'\u00A0'.repeat(item.depth * 2)}
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary btn-xs"
                                disabled={!newName.trim() || isBusy}
                            >
                                {createCategory.isPending
                                    ? 'zapisywanie...'
                                    : 'dodaj'}
                            </button>
                        </form>

                        <hr
                            style={{ margin: '14px 0', borderColor: '#eef1f4' }}
                        />

                        {isLoading ? (
                            <p className="text-muted">Ładowanie kategorii...</p>
                        ) : !drafts.length ? (
                            <p className="text-muted">Brak kategorii.</p>
                        ) : (
                            <div>
                                {drafts.map((draft) => (
                                    <CategoryEditorRow
                                        key={draft.id}
                                        draft={draft}
                                        tree={flatTree}
                                        isBusy={isBusy}
                                        isSaving={
                                            updateCategory.isPending &&
                                            updateCategory.variables?.id ===
                                                draft.id
                                        }
                                        isDeleting={
                                            deleteCategory.isPending &&
                                            deleteCategory.variables ===
                                                draft.id
                                        }
                                        onSave={handleUpdate}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-default btn-xs"
                            onClick={onClose}
                        >
                            zamknij
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CategoryEditorRow({
    draft,
    tree,
    isBusy,
    isSaving,
    isDeleting,
    onSave,
    onDelete,
}: {
    draft: CategoryDraft;
    tree: Array<{ id: number; name: string; depth: number }>;
    isBusy: boolean;
    isSaving: boolean;
    isDeleting: boolean;
    onSave: (draft: CategoryDraft) => Promise<void>;
    onDelete: (id: number, name: string) => Promise<void>;
}) {
    const [state, setState] = useState<CategoryDraft>(draft);

    useEffect(() => {
        setState(draft);
    }, [draft]);

    return (
        <div
            style={{
                border: '1px solid #e6eaee',
                borderRadius: 3,
                padding: 10,
                marginBottom: 10,
            }}
        >
            <div className="form-group">
                <label
                    className="control-label"
                    htmlFor={`cat_name_${draft.id}`}
                >
                    Nazwa
                </label>
                <input
                    id={`cat_name_${draft.id}`}
                    className="form-control"
                    value={state.name}
                    onChange={(e) =>
                        setState((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={isBusy}
                />
            </div>
            <div className="form-group">
                <label
                    className="control-label"
                    htmlFor={`cat_parent_${draft.id}`}
                >
                    Kategoria nadrzędna
                </label>
                <select
                    id={`cat_parent_${draft.id}`}
                    className="form-control"
                    value={state.parentId ?? ''}
                    onChange={(e) =>
                        setState((prev) => ({
                            ...prev,
                            parentId: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                        }))
                    }
                    disabled={isBusy}
                >
                    <option value="">(główna)</option>
                    {tree
                        .filter((item) => item.id !== state.id)
                        .map((item) => (
                            <option key={item.id} value={item.id}>
                                {'\u00A0'.repeat(item.depth * 2)}
                                {item.name}
                            </option>
                        ))}
                </select>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                }}
            >
                <div className="form-group">
                    <label
                        className="control-label"
                        htmlFor={`cat_sort_order_${draft.id}`}
                    >
                        Kolejność
                    </label>
                    <input
                        id={`cat_sort_order_${draft.id}`}
                        type="number"
                        className="form-control"
                        value={state.sortOrder}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                sortOrder: Number(e.target.value || 0),
                            }))
                        }
                        disabled={isBusy}
                    />
                </div>
                <div className="form-group">
                    <label
                        className="control-label"
                        htmlFor={`cat_active_${draft.id}`}
                    >
                        Aktywna
                    </label>
                    <select
                        id={`cat_active_${draft.id}`}
                        className="form-control"
                        value={state.isActive ? '1' : '0'}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                isActive: e.target.value === '1',
                            }))
                        }
                        disabled={isBusy}
                    >
                        <option value="1">tak</option>
                        <option value="0">nie</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    type="button"
                    className="btn btn-default btn-xs"
                    onClick={() => void onSave(state)}
                    disabled={isBusy || !state.name.trim()}
                >
                    {isSaving ? 'zapisywanie...' : 'zapisz'}
                </button>
                <button
                    type="button"
                    className="btn btn-danger btn-xs"
                    onClick={() => void onDelete(state.id, state.name)}
                    disabled={isBusy}
                >
                    {isDeleting ? 'usuwanie...' : 'usuń'}
                </button>
            </div>
        </div>
    );
}
