import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
    useCreateProductCategory,
    useDeleteProductCategory,
    useProductCategories,
    useUpdateProductCategory,
    useReorderProductCategories,
} from '@/hooks/useWarehouseViews';
import type { ProductCategory } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';

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
                    role="dialog"
                    aria-modal="true"
                    aria-label="Zarządzaj kategoriami"
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
                                className="btn btn-outline-secondary btn-sm"
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
    const reorderCategories = useReorderProductCategories();

    const [newName, setNewName] = useState('');
    const [newParentId, setNewParentId] = useState<number | undefined>(
        undefined,
    );
    const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const flatTree = useMemo(() => flattenCategories(tree), [tree]);
    const drafts = useMemo(() => toDrafts(tree), [tree]);
    // Top-level (root) categories in display order — the ones we let the user
    // reorder with up/down (parent categories = "position in menu").
    const topLevelIds = useMemo(() => tree.map((c) => c.id), [tree]);
    const isBusy =
        createCategory.isPending ||
        updateCategory.isPending ||
        deleteCategory.isPending ||
        reorderCategories.isPending;

    const moveTopLevel = (id: number, direction: -1 | 1) => {
        const index = topLevelIds.indexOf(id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= topLevelIds.length) return;
        const ordered = [...topLevelIds];
        [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
        const items = ordered.map((cid, i) => ({ id: cid, sortOrder: i }));
        void reorderCategories.mutateAsync(items).catch(() => {
            // error handled by hook
        });
    };

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = newName.trim();
        if (!name) return;
        try {
            await createCategory.mutateAsync({
                name,
                parentId: newParentId,
                sortOrder: 0,
                isActive: true,
            });
            setNewName('');
            setNewParentId(undefined);
        } catch {
            // error handled by hook
        }
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
        try {
            await updateCategory.mutateAsync({
                id: draft.id,
                payload,
            });
        } catch {
            // error handled by hook
        }
    };

    const handleDelete = (id: number, name: string) => {
        setConfirmDeleteCategory({ id, name });
    };

    return (
        <div className="modal-backdrop fade in" onClick={onClose}>
            <div
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Zarządzaj kategoriami"
                onClick={(e) => e.stopPropagation()}
            >
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
                            <div className="mb-2">
                                <label
                                    className="loyalty-kpi-label"
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
                            <div className="mb-2">
                                <label
                                    className="loyalty-kpi-label"
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
                                className="btn btn-primary btn-sm"
                                disabled={!newName.trim() || isBusy}
                            >
                                {createCategory.isPending
                                    ? 'zapisywanie...'
                                    : 'dodaj'}
                            </button>
                        </form>

                        <hr className="my-[14px] border-[#eef1f4]" />

                        {isLoading ? (
                            <p className="text-muted">Ładowanie kategorii...</p>
                        ) : !drafts.length ? (
                            <p className="text-muted">Brak kategorii.</p>
                        ) : (
                            <div>
                                {drafts.map((draft) => {
                                    const topIndex = topLevelIds.indexOf(
                                        draft.id,
                                    );
                                    const isTopLevel = topIndex >= 0;
                                    return (
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
                                            canMoveUp={
                                                isTopLevel && topIndex > 0
                                            }
                                            canMoveDown={
                                                isTopLevel &&
                                                topIndex <
                                                    topLevelIds.length - 1
                                            }
                                            onMoveUp={() =>
                                                moveTopLevel(draft.id, -1)
                                            }
                                            onMoveDown={() =>
                                                moveTopLevel(draft.id, 1)
                                            }
                                            onSave={handleUpdate}
                                            onDelete={handleDelete}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={onClose}
                        >
                            zamknij
                        </button>
                    </div>
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

function CategoryEditorRow({
    draft,
    tree,
    isBusy,
    isSaving,
    isDeleting,
    canMoveUp,
    canMoveDown,
    onMoveUp,
    onMoveDown,
    onSave,
    onDelete,
}: {
    draft: CategoryDraft;
    tree: Array<{ id: number; name: string; depth: number }>;
    isBusy: boolean;
    isSaving: boolean;
    isDeleting: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onSave: (draft: CategoryDraft) => Promise<void>;
    onDelete: (id: number, name: string) => void | Promise<void>;
}) {
    const [state, setState] = useState<CategoryDraft>(draft);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setState(draft);
    }, [draft]);

    const depth = tree.find((t) => t.id === draft.id)?.depth ?? 0;

    const handleSave = async () => {
        await onSave(state);
        setIsEditing(false);
    };

    return (
        <div className="salonbw-cat-row">
            <div className="d-flex align-items-center justify-content-between px-3 py-2 gap-2">
                <span
                    className="d-flex align-items-center gap-2 text-truncate"
                    style={{ paddingLeft: depth * 16 }}
                >
                    <span className="fw-medium text-truncate">
                        {draft.name}
                    </span>
                    {!draft.isActive && (
                        <span className="badge text-bg-light text-muted fw-normal">
                            nieaktywna
                        </span>
                    )}
                </span>
                <div className="btn-group flex-shrink-0">
                    {(canMoveUp || canMoveDown) && (
                        <>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={onMoveUp}
                                disabled={isBusy || !canMoveUp}
                                title="Przesuń wyżej"
                                aria-label="Przesuń kategorię wyżej"
                            >
                                <i className="fa fa-arrow-up"></i>
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={onMoveDown}
                                disabled={isBusy || !canMoveDown}
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
                        onClick={() => setIsEditing((v) => !v)}
                        disabled={isBusy}
                        aria-expanded={isEditing}
                        title="Edytuj kategorię"
                        aria-label="Edytuj kategorię"
                    >
                        <i className="fa fa-pencil"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => void onDelete(state.id, state.name)}
                        disabled={isBusy}
                        title="Usuń kategorię"
                        aria-label="Usuń kategorię"
                    >
                        {isDeleting ? (
                            <span className="spinner-border spinner-border-sm" />
                        ) : (
                            <i className="fa fa-trash text-danger"></i>
                        )}
                    </button>
                </div>
            </div>
            {isEditing && (
                <div className="px-3 pb-3 pt-3 border-top">
                    <div className="mb-2">
                        <label
                            className="loyalty-kpi-label"
                            htmlFor={`cat_name_${draft.id}`}
                        >
                            Nazwa
                        </label>
                        <input
                            id={`cat_name_${draft.id}`}
                            className="form-control"
                            value={state.name}
                            onChange={(e) =>
                                setState((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            disabled={isBusy}
                        />
                    </div>
                    <div className="mb-2">
                        <label
                            className="loyalty-kpi-label"
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
                    <div className="row row-cols-1 row-cols-sm-2 g-2">
                        <div className="mb-2">
                            <label
                                className="loyalty-kpi-label"
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
                        <div className="mb-2">
                            <label
                                className="loyalty-kpi-label"
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

                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-dark btn-sm"
                            onClick={() => void handleSave()}
                            disabled={isBusy || !state.name.trim()}
                        >
                            {isSaving ? 'zapisywanie...' : 'zapisz'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setState(draft);
                                setIsEditing(false);
                            }}
                            disabled={isBusy}
                        >
                            anuluj
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
