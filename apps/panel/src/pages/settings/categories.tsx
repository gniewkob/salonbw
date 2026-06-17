import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import ConfirmModal from '@/components/ConfirmModal';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    useCreateProductCategory,
    useDeleteProductCategory,
    useProductCategories,
    useReorderProductCategories,
    useUpdateProductCategory,
} from '@/hooks/useWarehouseViews';
import PanelSection from '@/components/ui/PanelSection';
import type { ProductCategory } from '@/types';

const WAREHOUSE_NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Ustawienia magazynu</h4>
            <ul>
                <li>
                    <Link href="/settings/categories" className="active">
                        <div className="icon_box">
                            <span className="icon sprite-settings_product_categories_nav" />
                        </div>
                        Kategorie produktów
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

type CategoryNode = ProductCategory & { children: CategoryNode[] };

function toCategoryNodes(categories: ProductCategory[]): CategoryNode[] {
    return categories.map((category) => ({
        ...category,
        children: toCategoryNodes(category.children ?? []),
    }));
}

function cloneTree(nodes: CategoryNode[]): CategoryNode[] {
    return nodes.map((node) => ({
        ...node,
        children: cloneTree(node.children),
    }));
}

function flattenTree(
    nodes: CategoryNode[],
    parentId: number | null = null,
): Array<{ id: number; parentId: number | null; sortOrder: number }> {
    return nodes.flatMap((node, index) => [
        { id: node.id, parentId, sortOrder: index },
        ...flattenTree(node.children, node.id),
    ]);
}

function moveNode(
    tree: CategoryNode[],
    categoryId: number,
    direction: 'up' | 'down',
) {
    const moveWithin = (nodes: CategoryNode[]): boolean => {
        const index = nodes.findIndex((node) => node.id === categoryId);
        if (index >= 0) {
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= nodes.length) {
                return true;
            }
            const [item] = nodes.splice(index, 1);
            nodes.splice(target, 0, item);
            return true;
        }
        return nodes.some((node) => moveWithin(node.children));
    };

    moveWithin(tree);
    return tree;
}

function renderCategoryRows(
    nodes: CategoryNode[],
    options: {
        deletingId: number | null;
        isReorderMode: boolean;
        onDelete: (category: ProductCategory) => void;
        onEdit: (category: ProductCategory) => void;
        onAddSub: (parentId: number) => void;
        onMove: (categoryId: number, direction: 'up' | 'down') => void;
    },
    depth = 0,
): ReactNode[] {
    return nodes.flatMap((category, index) => {
        const siblings = nodes.length;
        const row = (
            <tr key={category.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                <td style={{ paddingLeft: `${8 + depth * 20}px` }}>
                    {category.name}
                </td>
                <td className="actions" style={{ textAlign: 'right' }}>
                    {options.isReorderMode ? (
                        <span className="btn-group">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={index === 0}
                                onClick={() =>
                                    options.onMove(category.id, 'up')
                                }
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={index === siblings - 1}
                                onClick={() =>
                                    options.onMove(category.id, 'down')
                                }
                            >
                                ↓
                            </button>
                        </span>
                    ) : (
                        <span className="btn-group">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => options.onEdit(category)}
                            >
                                edytuj
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => options.onAddSub(category.id)}
                            >
                                dodaj podkategorię
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={options.deletingId === category.id}
                                onClick={() => options.onDelete(category)}
                            >
                                usuń
                            </button>
                        </span>
                    )}
                </td>
            </tr>
        );

        return [
            row,
            ...renderCategoryRows(category.children, options, depth + 1),
        ];
    });
}

function flattenForSelect(
    nodes: CategoryNode[],
    excludeId: number | null,
    depth = 0,
): Array<{ id: number; label: string }> {
    return nodes.flatMap((node) => {
        if (node.id === excludeId) return [];
        return [
            { id: node.id, label: `${' '.repeat(depth * 3)}${node.name}` },
            ...flattenForSelect(node.children, excludeId, depth + 1),
        ];
    });
}

interface CategoryFormState {
    name: string;
    parentId: number | null;
}

/** Add / edit product-category dialog (matches the service-category modal). */
function ProductCategoryFormModal({
    open,
    editing,
    fixedParentId,
    parentOptions,
    saving,
    onClose,
    onSubmit,
}: {
    open: boolean;
    editing: ProductCategory | null;
    fixedParentId: number | null;
    parentOptions: Array<{ id: number; label: string }>;
    saving: boolean;
    onClose: () => void;
    onSubmit: (data: CategoryFormState) => void;
}) {
    const [form, setForm] = useState<CategoryFormState>({
        name: '',
        parentId: null,
    });
    const firstFieldRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setForm({
                name: editing?.name ?? '',
                parentId: editing ? (editing.parentId ?? null) : fixedParentId,
            });
        }
    }, [open, editing, fixedParentId]);

    useEffect(() => {
        if (!open) return;
        firstFieldRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const canSubmit = form.name.trim().length > 0 && !saving;
    const parentLocked = !editing && fixedParentId !== null;

    return (
        <div
            className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center p-3"
            style={{
                zIndex: 2100,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-category-modal-title"
                className="bg-white rounded-4 overflow-hidden"
                style={{
                    width: 'min(460px, 100%)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                    border: '1px solid rgba(0,0,0,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (canSubmit) onSubmit(form);
                    }}
                >
                    <div className="px-4 pt-4 pb-3">
                        <h6
                            id="product-category-modal-title"
                            className="fw-semibold mb-3"
                        >
                            {editing
                                ? 'Edytuj kategorię produktów'
                                : 'Nowa kategoria produktów'}
                        </h6>
                        <div className="mb-3">
                            <label
                                htmlFor="product-category-name"
                                className="form-label small"
                            >
                                Nazwa kategorii
                            </label>
                            <input
                                ref={firstFieldRef}
                                id="product-category-name"
                                type="text"
                                className="form-control"
                                value={form.name}
                                maxLength={100}
                                required
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="product-category-parent"
                                className="form-label small"
                            >
                                Kategoria nadrzędna (opcjonalnie)
                            </label>
                            <select
                                id="product-category-parent"
                                className="form-select"
                                value={form.parentId ?? ''}
                                disabled={parentLocked}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        parentId: e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                    }))
                                }
                            >
                                <option value="">— brak (główna) —</option>
                                {parentOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="px-4 pb-4 d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={onClose}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={!canSubmit}
                        >
                            {saving
                                ? 'Zapisywanie...'
                                : editing
                                  ? 'Zapisz zmiany'
                                  : 'Dodaj kategorię'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SettingsCategoriesPage() {
    const { role } = useAuth();
    useSetSecondaryNav(WAREHOUSE_NAV);

    const toast = useToast();
    const queryClient = useQueryClient();
    const { data: categories = [], isLoading } = useProductCategories();
    const createCategory = useCreateProductCategory();
    const updateCategory = useUpdateProductCategory();
    const deleteCategory = useDeleteProductCategory();
    const reorderCategories = useReorderProductCategories();
    const [reorderMode, setReorderMode] = useState(false);
    const [draftTree, setDraftTree] = useState<CategoryNode[]>([]);
    const [confirmDeleteCategory, setConfirmDeleteCategory] =
        useState<ProductCategory | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] =
        useState<ProductCategory | null>(null);
    const [fixedParentId, setFixedParentId] = useState<number | null>(null);

    const tree = useMemo<CategoryNode[]>(
        () => toCategoryNodes(categories),
        [categories],
    );

    const parentOptions = useMemo(
        () => flattenForSelect(tree, editingCategory?.id ?? null),
        [tree, editingCategory],
    );

    const openAdd = () => {
        setEditingCategory(null);
        setFixedParentId(null);
        setModalOpen(true);
    };
    const openEdit = (category: ProductCategory) => {
        setEditingCategory(category);
        setFixedParentId(null);
        setModalOpen(true);
    };
    const openAddSub = (parentId: number) => {
        setEditingCategory(null);
        setFixedParentId(parentId);
        setModalOpen(true);
    };

    const handleSubmitCategory = (data: {
        name: string;
        parentId: number | null;
    }) => {
        const payload = {
            name: data.name.trim(),
            parentId: data.parentId ?? undefined,
        };
        if (editingCategory) {
            updateCategory.mutate(
                { id: editingCategory.id, payload },
                {
                    onSuccess: () => {
                        toast.success('Kategoria zapisana');
                        setModalOpen(false);
                    },
                    onError: () =>
                        toast.error('Nie udało się zapisać kategorii'),
                },
            );
        } else {
            createCategory.mutate(payload, {
                onSuccess: () => {
                    toast.success('Kategoria dodana');
                    setModalOpen(false);
                },
                onError: () => toast.error('Nie udało się dodać kategorii'),
            });
        }
    };

    const visibleTree = reorderMode ? draftTree : tree;

    const beginReorder = () => {
        setDraftTree(cloneTree(tree));
        setReorderMode(true);
    };

    const cancelReorder = () => {
        setDraftTree([]);
        setReorderMode(false);
    };

    const handleDelete = (category: ProductCategory) => {
        setConfirmDeleteCategory(category);
    };

    const handleMove = (categoryId: number, direction: 'up' | 'down') => {
        setDraftTree((current) =>
            moveNode(cloneTree(current), categoryId, direction),
        );
    };

    const handleSaveOrder = async () => {
        try {
            await reorderCategories.mutateAsync(flattenTree(draftTree));
            setReorderMode(false);
            setDraftTree([]);
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ['product-categories'],
                }),
                queryClient.invalidateQueries({
                    queryKey: ['product-categories-tree'],
                }),
            ]);
        } catch {
            // error shown via reorderCategories.isError
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Kategorie produktów — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {WAREHOUSE_NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                { label: 'Ustawienia magazynu' },
                                { label: 'Kategorie produktów' },
                            ]}
                        />
                        <PanelSection title="Kategorie produktów">
                            <div className="actions mb-2">
                                <Link
                                    href="/products"
                                    className="btn btn-outline-secondary"
                                    style={{ marginRight: 8 }}
                                >
                                    lista produktów
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ marginRight: 8 }}
                                    onClick={openAdd}
                                >
                                    + dodaj kategorię produktów
                                </button>
                                {reorderMode ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={
                                                reorderCategories.isPending
                                            }
                                            onClick={() =>
                                                void handleSaveOrder()
                                            }
                                        >
                                            {reorderCategories.isPending
                                                ? 'zapisywanie...'
                                                : 'zapisz nowy układ'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            style={{ marginLeft: 8 }}
                                            onClick={cancelReorder}
                                        >
                                            anuluj
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={beginReorder}
                                    >
                                        zmień układ
                                    </button>
                                )}
                            </div>
                            {deleteCategory.isError && (
                                <div className="alert alert-danger mb-2">
                                    Nie udało się usunąć kategorii. Spróbuj
                                    ponownie.
                                </div>
                            )}
                            {reorderCategories.isError && (
                                <div className="alert alert-danger mb-2">
                                    Nie udało się zapisać nowego układu. Spróbuj
                                    ponownie.
                                </div>
                            )}
                            {isLoading ? (
                                <p>Ładowanie...</p>
                            ) : (
                                <table className="table table-striped table-bordered">
                                    <thead>
                                        <tr>
                                            <th scope="col">Nazwa</th>
                                            <th
                                                scope="col"
                                                style={{ width: 260 }}
                                            >
                                                Akcje
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleTree.length === 0 ? (
                                            <tr>
                                                <td colSpan={2}>
                                                    Brak kategorii
                                                </td>
                                            </tr>
                                        ) : (
                                            renderCategoryRows(visibleTree, {
                                                deletingId:
                                                    deleteCategory.isPending
                                                        ? (deleteCategory.variables ??
                                                          null)
                                                        : null,
                                                isReorderMode: reorderMode,
                                                onDelete: handleDelete,
                                                onEdit: openEdit,
                                                onAddSub: openAddSub,
                                                onMove: handleMove,
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </PanelSection>
                    </div>
                </div>
                <ConfirmModal
                    open={!!confirmDeleteCategory}
                    title="Usuń kategorię"
                    message={`Operacji nie można cofnąć. Czy na pewno chcesz usunąć kategorię "${confirmDeleteCategory?.name}"?`}
                    confirmLabel="Usuń"
                    confirmVariant="danger"
                    onConfirm={() => {
                        if (!confirmDeleteCategory) return;
                        deleteCategory.mutate(confirmDeleteCategory.id);
                        setConfirmDeleteCategory(null);
                    }}
                    onCancel={() => setConfirmDeleteCategory(null)}
                />
                <ProductCategoryFormModal
                    open={modalOpen}
                    editing={editingCategory}
                    fixedParentId={fixedParentId}
                    parentOptions={parentOptions}
                    saving={
                        createCategory.isPending || updateCategory.isPending
                    }
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleSubmitCategory}
                />
            </SalonShell>
        </RouteGuard>
    );
}
